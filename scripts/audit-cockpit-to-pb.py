"""Read-only migration audit. Reports IDs/field names, never credential values.

python3 scripts/audit-cockpit-to-pb.py --output /private/tmp/emmaus-audit.json
Add --files to compare migrated binaries using SHA-256 (downloads in memory).
Exit 2 means differences or incomplete coverage require review, not data loss.
"""
import argparse
import collections
import concurrent.futures
import datetime
import hashlib
import html
import json
import os
from pathlib import Path
import re
import urllib.parse
import urllib.request
import urllib.error

MAPPING = {
    'persons': 'person', 'liturgy_events': 'liturgyEvent',
    'liturgy_rosters': 'liturgyRoster', 'cache': 'cache',
    'reservations': 'reservations', 'newsletter': 'newsletter',
    'shared_links': 'shared_links', 'alpha_registrations': 'alpha_registration',
    'weeklies': 'weekly_e', 'paper_projects': 'paper_projects',
    'paper_articles': 'paper_articles', 'paper_texts': 'paper_texts',
    'paper_stats': 'paper_stats', 'sites': 'site', 'articles': 'articles',
    'emmausbote': 'Emmausbote',
}
FIELDS = {
    'persons': 'name email username code active last_login competences',
    'liturgy_events': 'calendar_event_id date liturgy_name cancellations',
    'liturgy_rosters': 'liturgy_event person person_name position status',
    'cache': 'key value',
    'reservations': 'occasion times contact_name contact_phone contact_relation contact_mail rooms access access_via approved_sitemanager approved_sitemanager_at sitemanager_secret approved_reverend approved_reverend_at reverend_secret',
    'newsletter': 'mail token active', 'shared_links': 'expiration folder ids',
    'alpha_registrations': 'name phone mail postal', 'weeklies': 'name start end data sent',
    'paper_projects': 'name deadline printrelease',
    'paper_articles': 'name project status author format char_min char_max gid',
    'paper_texts': 'article text datetime',
    'paper_stats': 'project day writing written corrected finished',
    'sites': 'name slug title summary icon html sort_order parent cockpit_created cockpit_modified',
    'articles': 'title title_slug author content public', 'emmausbote': 'date',
    'impressum': 'title content',
    'liturgies': 'key position name rank color reading1 reading2 psalm evangelium',
}
RELATIONS = {
    ('paper_articles', 'project'): 'paper_projects',
    ('paper_texts', 'article'): 'paper_articles',
    ('paper_stats', 'project'): 'paper_projects',
    ('sites', 'parent'): 'sites',
    ('liturgy_rosters', 'liturgy_event'): 'liturgy_events',
    ('liturgy_rosters', 'person'): 'persons',
}


def request(url, headers=None, data=None):
    headers = dict(headers or {})
    if data is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, headers=headers,
                                 data=json.dumps(data).encode() if data is not None else None)
    with urllib.request.urlopen(req, timeout=90) as response:
        return json.load(response)


def pages(url, headers, key, page_size=100):
    rows, page, expected = [], 1, None
    while True:
        data = request(url + '?' + urllib.parse.urlencode({'page': page, 'perPage': page_size}), headers)
        if expected is not None and data['totalItems'] != expected:
            raise ValueError('Collection changed while paging; rerun audit')
        expected = data['totalItems']
        rows.extend(data[key])
        if page >= data['totalPages']:
            break
        page += 1
    if len(rows) != expected or len({r['id'] for r in rows}) != len(rows):
        raise ValueError('Incomplete or duplicate PocketBase pagination')
    return rows


def flatten(nodes, parent=''):
    rows = []
    for order, node in enumerate(nodes):
        row = dict(node, parent=parent, sort_order=order)
        rows.append(row)
        rows.extend(flatten(node.get('children') or [], node['_id']))
    return rows


def source_file_url(base, path):
    if urllib.parse.urlparse(path).scheme in ('http', 'https'):
        return path
    return base.rstrip('/') + '/' + urllib.parse.quote(path.lstrip('/'), safe='/')


def normalized(value, field):
    kind = field.get('type')
    if kind == 'bool':
        return bool(value)
    if kind == 'number':
        return float(value or 0)
    if kind in ('date', 'autodate') and value:
        parsed = datetime.datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=datetime.timezone.utc)
        return parsed.astimezone(datetime.timezone.utc).isoformat()
    if kind == 'json':
        return value
    if kind in ('select', 'relation') and field.get('maxSelect', 1) > 1:
        return sorted(value or [])
    return str(value or '').replace('\r\n', '\n')


def schema_issues(payload, fields):
    issues = []
    for name, value in payload.items():
        field = fields.get(name)
        if not field:
            issues.append((name, 'unknown_target_field'))
            continue
        kind = field['type']
        if field.get('required') and (value is None or value == '' or value == []):
            issues.append((name, 'required_empty'))
        if kind == 'select':
            values = value if isinstance(value, list) else [value]
            if any(v and v not in field['values'] for v in values):
                issues.append((name, 'unsupported_select_value'))
            if field.get('maxSelect', 1) > 1 and len(values) > field['maxSelect']:
                issues.append((name, 'too_many_selected'))
        if kind in ('text', 'editor', 'json'):
            length = len(json.dumps(value, ensure_ascii=False).encode()) if kind == 'json' else len(str(value or ''))
            maximum = (field.get('max') or 5000) if kind == 'text' else field.get('maxSize', 0)
            if maximum and length > maximum:
                issues.append((name, 'maximum_length_exceeded'))
        if kind == 'number':
            try:
                number = float(value or 0)
                if field.get('onlyInt') and not number.is_integer():
                    issues.append((name, 'integer_required'))
            except (ValueError, TypeError):
                issues.append((name, 'invalid_number'))
    return issues


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    parser.add_argument('--files', action='store_true')
    args = parser.parse_args()
    cfg = {}
    for line in (Path(__file__).resolve().parents[1] / '.env').read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            cfg[key.strip()] = value.strip().strip('\"\'')
    cfg.update(os.environ)
    base = cfg['POCKETBASE_URL'].rstrip('/')
    cpbase = cfg['COCKPIT_HOST'].rstrip('/')
    cpheaders = {'Cockpit-Token': cfg['COCKPIT_TOKEN']}
    auth = request(base + '/api/collections/_superusers/auth-with-password', data={
        'identity': cfg['PB_ADMIN_EMAIL'], 'password': cfg['PB_ADMIN_PASSWORD']})
    headers = {'Authorization': auth['token']}
    schemas = {s['name']: s for s in pages(base + '/api/collections', headers, 'items')}
    targets = {}
    for name in [*MAPPING, 'liturgies', 'impressum', 'content_assets']:
        targets[name] = pages(base + '/api/collections/' + name + '/records', headers, 'items',
                              page_size=500 if name == 'paper_texts' else 100)
        print('PocketBase', name, len(targets[name]), flush=True)
    sources, definitions = {}, {}
    inventory = request(cpbase + '/api/collections/listCollections', cpheaders)
    for target, source in MAPPING.items():
        data = request(cpbase + '/api/collections/get/' + source, cpheaders)
        rows = data['entries']
        # Legacy API returns all records unless a limit is supplied. Never silently
        # accept truncation: a count mismatch is a failed audit, not missing data.
        flat = flatten(rows) if target == 'sites' else rows
        if data.get('total') is None or (len(rows) != data['total'] and len(flat) != data['total']):
            raise ValueError('Incomplete Cockpit response: ' + source)
        sources[target] = flat
        definitions[target] = data.get('fields', [])
        print('Cockpit', source, len(sources[target]), flush=True)
    internal = request(cpbase + '/api/collections/get/internal-data', cpheaders)
    assert len(internal['entries']) == internal['total']
    internals = {r['_id']: r for r in internal['entries']}
    sources['impressum'] = [dict(internals['675df468613062eb9e0000ed']['data'], _id='675df468613062eb9e0000ed')]
    sources['liturgies'] = [dict(v, key=key, position=i, _id=key + ':' + str(i))
        for key, variants in internals['61b86ada3831347379000158']['data'].items()
        for i, v in enumerate(variants if isinstance(variants, list) else [])]
    by_cp = {name: {r.get('cockpit_id'): r for r in rows if r.get('cockpit_id')}
             for name, rows in targets.items()}
    source_ids = {name: {r['_id'] for r in rows} for name, rows in sources.items()}
    asset_urls = {r['cockpit_path'].lstrip('/'): base + '/api/files/content_assets/' + r['id'] + '/' + urllib.parse.quote(r['file'])
                  for r in targets['content_assets'] if r.get('file')}
    report = {'started_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'collections': {}, 'findings': [], 'files': {},
              'exclusions': {'article': 'Unused legacy collection, intentionally not migrated',
                             'whatsapp_verification': 'Feature removed',
                             'internal-data': 'Liturgy and impressum mapped; other entries inventoried separately'},
              'limits': ['Live reads are not a transactional cross-system snapshot.',
                         'Differences may be legitimate changes after cutover; never overwrite automatically.',
                         'Articles lost cockpit_id: unique title_slug, or unique title when slug is absent; not proof of historical identity.',
                         'Google Docs, Drive and Calendar contents are external and not copied by this migration.',
                         'Admin accounts were migrated selectively; credentials are not compared.']}
    def finding(kind, collection, ident, **detail):
        report['findings'].append(dict(kind=kind, collection=collection, id=ident, **detail))
    report['select_definitions_checked'] = 0
    for name, definitions_for_collection in definitions.items():
        fields = {f['name']: f for f in schemas[name]['fields']}
        values = definitions_for_collection.values() if isinstance(definitions_for_collection, dict) else definitions_for_collection
        for source_field in values:
            target_field = fields.get(source_field['name'], {})
            configuration = source_field.get('options')
            options = configuration.get('options') if isinstance(configuration, dict) else None
            if source_field.get('type') == 'select' and target_field.get('type') == 'select' and isinstance(options, dict):
                report['select_definitions_checked'] += 1
                unsupported = sorted(set(options) - set(target_field['values']))
                if unsupported:
                    finding('unsupported_configured_options', name, '', field=source_field['name'], options=unsupported)
    def rewrite(text):
        text = text or ''
        def replacement(match):
            path = html.unescape(match.group(1)).lstrip('/')
            return asset_urls.get(path, match.group(0))
        text = re.sub(r'https?://data\.(?:emmaus|eni)\.wien/(storage/[^\"\s<>\)\']+)', replacement, text)
        for path, url in asset_urls.items():
            text = text.replace('"/' + path + '"', '"' + url + '"').replace('"' + path + '"', '"' + url + '"')
        return text
    file_pairs = []
    for name, original_rows in sources.items():
        schema = {f['name']: f for f in schemas[name]['fields']}
        rows = original_rows
        if name == 'cache':
            rows = list({r['key']: r for r in rows}.values())
        stats = collections.Counter(source=len(original_rows), expected=len(rows), target=len(targets[name]))
        matched_ids = set()
        index = collections.defaultdict(list)
        for record in targets[name]:
            key = record.get('cockpit_id')
            if name == 'articles': key = record.get('title_slug')
            if name == 'cache': key = record.get('key')
            if name == 'liturgies': key = (record.get('key'), record.get('position'))
            index[key].append(record)
        for a in rows:
            ident = a['_id']
            payload = {f: a.get(f) for f in FIELDS[name].split()}
            if name == 'articles':
                published = str(a.get('published_at') or '').strip()
                german = re.fullmatch(r'(\d{2})\.(\d{2})\.(\d{4})', published)
                if german:
                    published = '-'.join([german[3], german[2], german[1]])
                if re.fullmatch(r'\d{4}-\d{2}-\d{2}', published):
                    original_created = datetime.datetime.fromtimestamp(a.get('_created') or 0, datetime.timezone.utc)
                    payload['created'] = original_created.isoformat() if original_created.date().isoformat() == published else published + 'T00:00:00Z'
                else:
                    finding('unparsed_source_publication_date', name, ident)
            if name == 'paper_articles' and a.get('status') is None:
                payload['status'] = 'writing'
            if name == 'liturgy_events':
                payload.update(calendar_event_id=a.get('eventId'), liturgy_name=a.get('liturgyName'),
                    cancellations=[v if isinstance(v, str) else v.get('value') for v in a.get('cancellations') or [] if v])
            if name == 'liturgy_rosters':
                payload.update(liturgy_event=a.get('liturgyEventId'), person=a.get('userId'), person_name=a.get('userName'))
            if name == 'sites':
                payload.update(html='\n'.join(v.get('settings', {}).get('text') or '' for v in a.get('layout') or [] if v.get('component') == 'text'),
                               cockpit_created=a.get('_created', 0), cockpit_modified=a.get('_modified', 0))
                ignored = [v.get('component') for v in a.get('layout') or [] if v.get('component') != 'text']
                if ignored: finding('unmapped_layout_components', name, ident, components=ignored)
            orphan = []
            for (collection, field), related in RELATIONS.items():
                if collection != name: continue
                value = payload[field]
                source_id = value.get('_id') if isinstance(value, dict) else value
                if (not source_id and schema[field].get('required')) or (source_id and source_id not in source_ids[related]):
                    orphan.append(field)
                elif source_id and source_id not in by_cp[related]:
                    finding('missing_relation_target', name, ident, field=field, source_target=source_id)
                payload[field] = by_cp[related].get(source_id, {}).get('id', '')
            ghost = name == 'liturgy_rosters' and not any(a.get(f) for f in ['liturgyEventId', 'userId', 'position'])
            if orphan or ghost:
                stats['source_orphan_or_ghost'] += 1
                finding('source_orphan_or_ghost', name, ident, fields=orphan)
                continue
            key = ident
            if name == 'articles': key = a.get('title_slug')
            if name == 'cache': key = a.get('key')
            if name == 'liturgies': key = (a['key'], a['position'])
            matches = index.get(key, [])
            if name == 'articles' and not key:
                matches = [b for b in targets[name] if b.get('title') == a.get('title')]
                if len(matches) == 1:
                    stats['matched_by_unique_title'] += 1
            if name == 'weeklies' and not matches:
                equivalents = [b for b in targets[name] if all(
                    normalized(a.get(f), schema[f]) == normalized(b.get(f), schema[f])
                    for f in FIELDS[name].split())]
                if len(equivalents) == 1:
                    stats['source_duplicate_identical'] += 1
                    finding('source_duplicate_identical', name, ident, equivalent_pb_id=equivalents[0]['id'])
                    continue
            if len(matches) != 1:
                stats['missing' if not matches else 'ambiguous'] += 1
                finding('missing' if not matches else 'ambiguous', name, ident)
            for field in ['html', 'content']:
                if field in payload: payload[field] = rewrite(payload[field])
            for field, value in list(payload.items()):
                definition = schema.get(field, {})
                if value is None:
                    payload[field] = [] if definition.get('maxSelect', 1) > 1 or field in ['times', 'rooms', 'ids', 'competences', 'cancellations'] else {} if field == 'data' else ''
                if definition.get('type') == 'bool': payload[field] = bool(value)
                if definition.get('type') == 'number': payload[field] = float(value or 0)
            for field, issue in schema_issues(payload, schema):
                stats['schema_issues'] += 1
                finding(issue, name, ident, field=field)
            if len(matches) != 1: continue
            b = matches[0]
            matched_ids.add(b['id'])
            differences = []
            for field, value in payload.items():
                try:
                    different = normalized(value, schema.get(field, {})) != normalized(b.get(field), schema.get(field, {}))
                except (ValueError, TypeError):
                    different = True
                if different: differences.append(field)
            if differences:
                stats['different'] += 1
                finding('different', name, ident, pb_id=b['id'], fields=differences, pb_updated=b.get('updated'))
            else: stats['equal'] += 1
            for cpfield, pbfield in ([('picture', 'image')] if name == 'articles' else [('file', 'file'), ('preview', 'preview')] if name == 'emmausbote' else []):
                ref = a.get(cpfield)
                path = ref.get('path') if isinstance(ref, dict) else ''
                if path and not b.get(pbfield): finding('missing_file', name, ident, field=pbfield)
                elif path:
                    file_pairs.append((name, ident, pbfield, source_file_url(cpbase, path), base + '/api/files/' + name + '/' + b['id'] + '/' + urllib.parse.quote(b[pbfield])))
        stats['target_unmatched'] = len(targets[name]) - len(matched_ids)
        report['collections'][name] = dict(stats)
    for r in targets['content_assets']:
        if r.get('file'):
            file_pairs.append(('content_assets', r['id'], 'file', source_file_url(cpbase, r['cockpit_path']), asset_urls[r['cockpit_path'].lstrip('/')]))
    # Check stored relation integrity independently of source matching.
    ids = {schemas[n]['id']: {r['id'] for r in rows} for n, rows in targets.items()}
    for name, rows in targets.items():
        for field in schemas[name]['fields']:
            if field['type'] != 'relation': continue
            if field['collectionId'] not in ids:
                finding('unchecked_relation_collection', name, '', field=field['name'])
                continue
            for row in rows:
                value = row.get(field['name'])
                for related_id in value if isinstance(value, list) else [value] if value else []:
                    if related_id not in ids[field['collectionId']]:
                        finding('dangling_target_relation', name, row['id'], field=field['name'])
    report['unmapped_collections'] = sorted(set(inventory) - set(MAPPING.values()) - set(report['exclusions']))
    report['other_internal_entries'] = [{ 'id': r['_id'], 'name': r.get('name') } for r in internal['entries'] if r['_id'] not in ['61b86ada3831347379000158', '675df468613062eb9e0000ed']]
    if args.files:
        def digest(url):
            h = hashlib.sha256()
            with urllib.request.urlopen(url, timeout=90) as response:
                first = response.read(1024 * 1024)
                if response.headers.get_content_type() == 'text/html' or first.lstrip().lower().startswith((b'<!doctype html', b'<html')):
                    raise ValueError('HTML response instead of media')
                h.update(first)
                while chunk := response.read(1024 * 1024): h.update(chunk)
            return h.hexdigest()
        def check_file(pair):
            name, ident, field, source, target = pair
            results = {}
            for side, url in [('source', source), ('target', target)]:
                try:
                    results[side] = {'sha256': digest(url)}
                except urllib.error.HTTPError as exc:
                    results[side] = {'error': 'HTTP ' + str(exc.code)}
                except ValueError:
                    results[side] = {'error': 'HTML instead of media'}
                except Exception as exc:
                    results[side] = {'error': type(exc).__name__}
            if 'error' in results['target']:
                status = 'target_invalid'
            elif 'error' in results['source']:
                status = 'source_unavailable'
            else:
                status = 'equal' if results['source']['sha256'] == results['target']['sha256'] else 'different'
            return name, ident, field, status, results
        counts = collections.Counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            for i, (name, ident, field, status, results) in enumerate(pool.map(check_file, file_pairs), 1):
                counts[status] += 1
                if status != 'equal': finding('file_' + status, name, ident, field=field, **results)
                if i % 20 == 0: print('Files checked', i, '/', len(file_pairs), flush=True)
        report['files'] = dict(counts)
    else:
        report['files'] = {'not_checked': len(file_pairs)}
    report['finding_counts'] = dict(collections.Counter(f['kind'] for f in report['findings']))
    report['finished_at'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'collections': report['collections'], 'findings': report['finding_counts'], 'files': report['files']}, ensure_ascii=False, indent=2))
    return 2 if report['findings'] or report['unmapped_collections'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
