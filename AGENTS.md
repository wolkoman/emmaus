# Agent notes

- Always use `kubectl --context=eco` for this project. The default kubectl
  context is unrelated (Teleport work clusters) — never run kubectl against
  it for emmaus.
- `api.emmaus.wien` is World4you static Apache hosting (FTP upload by hand), not
  PocketBase (`db.emmaus.wien`). `/videos/[slug]` renders whatever
  `api.emmaus.wien/videos/<slug>/video.json` describes; file expiry there is a
  per-folder `.htaccess`, separate from `offlineAt` in the JSON.
- Internal pages (logged-in apps and tools) are built only from
  `components/intern/`: `AppShell`/`AppTabs` (frame), `AppSidebar*` (sidebar),
  `AppCard`/`PageHeading`/`SectionHeading` (`AppUI.tsx`), `InternPage` (simple
  pages). Extend those instead of copying their classes into a page; login
  and logout use `InternShell`.
- Static content pages (e.g. `app/heilige-messe/`, replacing PocketBase
  `sites`) follow the homepage style and stay plain:
  - No decorative layers: no kicker/eyebrow labels above headings, no number
    badges, chips, icon tiles or pulsing dots, no hero CTA buttons.
  - No "AI-looking" effects: no scroll fade-ins, no reading-progress bar, no
    hover effects on non-interactive elements, no em/en dashes in copy.
  - Plain headings ("Termine und Ort"), not slogans or rule-of-three triads.
  - Only content that is fully correct for our parish. Omit simplified
    liturgical rules (postures, responses, "only on Sundays") rather than
    stating partial truths. Photos must show our church (not the neighbour
    church) and our own priest; the name is "Pfarre Emmaus am Wienerberg".
  - Address readers with "Sie" and don't reuse `ContactSection`, which
    uses "Du".
  - Sizes as on the homepage: hero `h-3xl`, section headings `text-3xl`,
    card/body text at the standard size.
- If `"use cache"` components fail in dev with `chunk.reason.enqueueModel is
  not a function`, the on-disk dev cache is corrupt: stop the server and
  delete `.next`; restarting alone is not enough.
- `bun add` on Manuel's machine writes the StepSecurity proxy URL into every
  `bun.lock` entry; Vercel can't reach it (401) and the deploy fails. After
  adding packages, replace those URLs with `""` (default registry) before
  committing.
- Secrets live in Doppler, workplace "emmaus" (private, not the Magic work
  workplace), project `emmaus`. The CLI login for it is scoped to
  `/Users/manuel/Projects/emmaus`; the global Doppler login is Magic's, so
  never run doppler for emmaus outside that folder. Configs and sync are in
  the README's "Secrets" section. New `NEXT_PUBLIC_*` secrets must be set
  `--visibility unmasked`: Vercel rejects them as sensitive and Doppler then
  disables the whole sync.
- Postfach (`/postfach`): mail status lives in the mailbox as IMAP flags
  (`\Answered`, `$Erledigt`; `$Ausgewertet` = already used for the list), so
  never mark mails `\Seen` or otherwise change flags on read. The lists are
  updated every 10 minutes and the digest sent at 07:00 by CronJobs in the
  eco cluster (`deploy/helm/templates/cronjob-site-crons.yaml`), which call
  the Vercel endpoints at www.emmaus.wien (the apex redirects, which curl
  would silently treat as success) with `CRON_SECRET` from `emmaus-secrets`.
- Local "Veröffentlichen" renders in the eco cluster: Doppler `dev` holds the
  `K8S_*`/`RENDERER_IMAGE` vars (docs/pdf-render-jobs.md); it also needs a
  `NEXT_PUBLIC_SITE_URL` tunnel to the port the dev server actually got.
  `scripts/dev.mjs` assumes port 3000; when Next falls back to 3001 it still
  reuses a tunnel to 3000, and the render job then fetches the wrong server.
  Publishing saves the issue to production PB before it renders.
- Livestream broadcast tools (`broadcast/`: OBS overlays, control page,
  camera pages): every visible state change is animated, at least a short
  fade; hard cuts look broken on air. This covers elements appearing,
  disappearing and swapping (overlay modes, pill, trailer, rotating text).
  Camera switching is done in OBS/ATEM and is out of scope.
  Everything shown before the livestream keeps the broadcast countdown visible.
  Pages only render server state; OBS, the ATEM and other systems are server
  modules (`broadcast/server/`), see the README's "How it fits together".
