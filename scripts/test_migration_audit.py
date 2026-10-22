import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('audit', Path(__file__).with_name('audit-cockpit-to-pb.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class AuditTest(unittest.TestCase):
    def test_dates_compare_as_utc(self):
        field = {'type': 'date'}
        self.assertEqual(audit.normalized('2026-07-20', field),
                         audit.normalized('2026-07-20 00:00:00.000Z', field))

    def test_nested_sites_keep_parent_and_order(self):
        rows = audit.flatten([{'_id': 'root', 'children': [{'_id': 'a'}, {'_id': 'b'}]}])
        self.assertEqual([(r['_id'], r['parent'], r['sort_order']) for r in rows],
                         [('root', '', 0), ('a', 'root', 0), ('b', 'root', 1)])

    def test_external_url_keeps_query(self):
        url = 'https://pbs.twimg.com/media/test?format=jpg&name=large'
        self.assertEqual(audit.source_file_url('https://data.emmaus.wien', url), url)

    def test_missing_format_is_detected(self):
        fields = {'format': {'type': 'select', 'values': ['C2600x3600x1']}}
        self.assertEqual(audit.schema_issues({'format': 'C4100x4900x1_1/2'}, fields),
                         [('format', 'unsupported_select_value')])

    def test_pagination_does_not_accept_partial_response(self):
        original = audit.request
        audit.request = lambda *args: {'items': [{'id': 'a'}], 'totalItems': 2, 'totalPages': 1}
        try:
            with self.assertRaisesRegex(ValueError, 'Incomplete'):
                audit.pages('https://unused', {}, 'items')
        finally:
            audit.request = original


if __name__ == '__main__':
    unittest.main()
