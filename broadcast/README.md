# Broadcast

A small local server for the livestream: it holds the state of the OBS browser
overlays, keeps every page in sync over a WebSocket, switches OBS scenes, runs
the crew chat with camera pages for the operators, and offers a control page
plus plain HTTP URLs (for the Stream Deck). It runs only on the streaming Mac
and is not part of the website deploy.

## Run

```bash
bun run broadcast
```

- Start page for the operators, linking to the camera pages: http://localhost:4321
- Control page (with the chat as "Regie"): http://localhost:4321/control
- Overlay for OBS: http://localhost:4321/overlay/main (the pre-live screen and the live overlay in one frame; each layer alone at `/overlay/prelive` and `/overlay/live`)
- Camera pages: `http://<mac>:4321/camera/1` … `/camera/4` (see "Cameras and chat")

The state lives in memory: a restart resets every field to its initial value.
Pages reconnect by themselves and keep their last state while the server is
down, but a browser source that loaded while the server was down stays blank
until you click "Refresh" on it in OBS, so start the server first.

| Env                      | Default               | Meaning                                                                 |
| ------------------------ | --------------------- | ----------------------------------------------------------------------- |
| `PORT`                   | `4321`                | HTTP and WebSocket port                                                 |
| `HOST`                   | `127.0.0.1`           | Bind address; `0.0.0.0` to control from a phone or iPad on the LAN      |
| `OBS_WEBSOCKET_URL`      | `ws://127.0.0.1:4455` | OBS's WebSocket server                                                  |
| `OBS_WEBSOCKET_PASSWORD` | empty                 | Its password; put it in `.env.local` next to `package.json` (gitignored) |
| `ACCESS_KEY`             | empty                 | Lets other devices (camera phones) in; without it only the Mac itself may connect |

## How it fits together

```
server/main.ts      entry: the schema, wiring, and the rules (who owns which field)
server/store.ts     the state: sections of fields, validation, change notifications
server/protocol.ts  the WebSocket messages, documented in one place
server/http.ts      pages, assets and the JSON API
server/obs.ts       connection to OBS (obs-websocket 5): switch scenes, report changes
server/chat.ts      crew chat: recent history and who is typing
content/            texts for the overlays (prelive.ts, trailer.ts, readings.ts, communion.ts)
public/             what browsers load: control page, camera page, overlays, shared modules
                    (overlay-client.js connection, chat.js chat panel, morph-text.js)
```

**State** is a set of sections (`obs`, `live`, `prelive`), each with string
fields. The schema in `main.ts` says what each field may hold (`choice` or
`time`) and is sent to the control page, which renders itself from it.

**Changes** arrive from the control page, overlays or HTTP and all go through
`set()` in `main.ts`: it validates them, then either applies them directly or,
for fields an outside system owns, asks that system first. `obs.scene` is such
a field: the server asks OBS to switch and updates the state once OBS has
started the transition. Changes made in OBS itself arrive the same way back.
Fields marked `readOnly` (e.g. `obs.connection`) can only be set by the server.
Only our own pages may open the WebSocket (the server checks their origin); the
HTTP set URLs stay open for the Stream Deck.

**Every change** is broadcast to all pages as the complete state. Pages only
ever render from the state; none of them talks to OBS.

**Chat** is not state but a stream of messages: the server keeps the last 200
in memory and sends them to chat clients on connect. A page joins the chat by
connecting to `/ws?client=<id>` (`director` or `cam1` … `cam4`); overlays
connect without an id and only get the state.

**Protocol** (`server/protocol.ts`, client side in `public/overlay-client.js`):

| Direction       | Message                                        | Meaning                                      |
| --------------- | ---------------------------------------------- | -------------------------------------------- |
| server → client | `{"type":"state","state":{…}}`                 | complete state; on connect and every change  |
| server → client | `{"type":"error","error":"…"}`                 | a message of this client was rejected        |
| server → client | `{"type":"chatHistory","messages":[…]}`        | recent chat, to chat clients on connect      |
| server → client | `{"type":"chatMessage","message":{…}}`         | a new chat message (`id`, `from`, `text`, `at`, questions also `question`) |
| server → client | `{"type":"chatUpdate","message":{…}}`          | a message changed (a question got an answer) |
| server → client | `{"type":"typing","clients":["cam2"]}`         | who is typing right now                      |
| server → client | `{"type":"programPicture","image":"data:…"}`   | snapshot of the program, ~1/s while subscribed |
| client → server | `{"type":"set","section":"live","patch":{…}}`  | change fields of one section                 |
| client → server | `{"type":"chat","text":"…"}`                   | send a chat message (chat clients only)      |
| client → server | `{"type":"ask","text":"…","to":["cam1"],"options":["Yes","No"]}` | ask cameras a question (director only) |
| client → server | `{"type":"answer","id":12,"option":"Yes"}`     | answer (or change the answer to) a question for this client |
| client → server | `{"type":"typing","typing":true}`              | typing indicator; expires after 4 s          |
| client → server | `{"type":"programPicture","enabled":true}`     | (un)subscribe the program picture; resend after reconnecting |

## OBS setup

1. **WebSocket server**: Tools → WebSocket Server Settings → enable it, keep
   authentication on, and put the password in `.env.local` as
   `OBS_WEBSOCKET_PASSWORD`. The control page shows `obs.connection`.
2. **Scenes**: `obs.scene` maps to OBS scenes in `OBS_SCENES` in `main.ts`
   (`prelive` → `Pre-Live`, `live` → `Live`).
3. **Browser source**: one, `Overlay (browser)` with
   `http://localhost:4321/overlay/main`, width 1920, height 1080, at 0, 0,
   scale 1, above `ATEM IN`. Put it in `Pre-Live` and `Live` (the second time
   via **Add → Add Existing**, so both share one page). Turn "Shutdown source
   when not visible" off (otherwise the page reloads on every scene switch) and
   tick **"Control audio via OBS"** so the trailer's sound reaches the stream.
   The page stacks the pre-live screen (below) and the live overlay (on top) in
   two frames; it replaces the former `Pre-Live Info` and `Live Indicator`
   browser sources.
4. **Transition**: the **Move** plugin, **800 ms**, easing **Cubic, In/Out**. It
   scales `ATEM IN` from the pre-live frame (688, 96, scale 0.6) to full screen;
   the page animates in step, so `--move-ms` and `--move-ease` at the top of
   `prelive.html` must match.

## Changing state

**Control page**: a button per value, a time picker per time field, and the
Stream Deck URL for each.

**HTTP** (CORS is open):

```bash
curl 'http://localhost:4321/api/obs/set?scene=live'
```

```bash
curl -X POST -H 'content-type: application/json' -d '{"mode":"on"}' http://localhost:4321/api/live/set
```

`GET /api/state` returns schema, state and overlay pages. Rejected changes get a
400 with the reason (invalid value, read-only field, OBS not connected).

## Stream Deck

Use the built-in **System → Website** action, paste a set URL (the control page
lists one per value) and tick **"GET request in background"** (called "Access in
background" in some versions); otherwise every press opens a browser tab. For
one key that toggles, put two Website actions into a **Multi Action Switch**.

## Cameras and chat

Each camera operator opens `/camera/<n>` on a phone: a large tally area (red
LIVE when the camera is on program, green PREVIEW when it is next, grey
STANDBY) and the crew chat. On the control page the director sets the operator
names (`cameras` section); the chat shows them as "Anna (cam1)".

- **Questions**: operators are busy with their camera, so the director can ask
  instead of chat ("Ask" next to "Send" on the control page): a question, who
  should answer, and 1 to 4 answers (default "Yes, No"); recipients and answers
  stay selected for the next question. The phone shows it as
  a card with big buttons at the bottom (first answer green, second red,
  others blue), plays a chime and reads it aloud if those are on. The answers
  appear in the chat; a mis-tap can be changed with the buttons in the chat.
- **@mentions**: `@cam1`, `@Anna` (the name set for cam1) or `@Regie`. A
  mention is highlighted for the person tagged. Typing `@` lists everyone in
  the chat (arrow keys and Enter/Tab or a click insert a name, Escape closes).

Settings sit behind the cog in the top-right corner of the tally area and are
remembered on each phone:

- **Read @mentions aloud**: the browser's text-to-speech reads
  messages that tag this camera, nothing else.
- **Sounds**: a soft tone when the camera goes to preview, two loud
  rising tones when it goes live.
- **Program picture** (on by default): what is on air as a 640×360
  JPEG about once a second, up to a second behind; tap it to fill the screen.
  The server only asks OBS for pictures while at least one phone shows them
  (`PICTURE` in `main.ts`). It is a snapshot of the program scene, so during a
  transition it already shows the target scene.
- **Keep screen awake** (on by default): the phone's screen stays on while the
  page is open, so it keeps receiving. It uses the browser's Wake Lock where
  allowed (HTTPS or localhost); over plain `http://<mac-ip>` it loops a tiny
  silent video instead (`public/keep-awake.js`), which phones also treat as
  "stay awake". It may need one tap after the page loads.
- **Fullscreen**: hides the browser bars on Android and iPad. iPhones don't
  allow it for web pages; there, "Add to Home Screen" opens the page without
  bars.
- Browsers only play audio after a tap, so switching sounds or read-aloud on
  also unlocks it; after reloading the page one tap anywhere is needed again.

**Tally** (`tally` section, `off` / `preview` / `program` per camera) is set by
hand on the control page for now; an ATEM integration will set it later.

**Phones on the network**: start the server with `HOST=0.0.0.0` and an
`ACCESS_KEY` (both can go in `.env.local`). The startup log prints the link
for phones with the Mac's network address and the key (the `en0`/`en1` line;
`bridge…` and `utun…` are virtual networks or VPNs). Each phone opens
`http://<mac-ip>:4321/?key=<ACCESS_KEY>` once; a cookie remembers the key, and
the start page links to the camera pages (bookmark yours, e.g. on the home
screen). Requests from the Mac itself never need the key. If phones can't
connect at all, allow incoming connections for `bun` in macOS's firewall.

## State and overlays

### `obs`

| Field        | Values               | Effect                                                    |
| ------------ | -------------------- | --------------------------------------------------------- |
| `scene`      | `prelive`, `live`    | Switches OBS (Move transition); also follows manual switches |
| `connection` | `offline`, `online`  | Read-only: whether the server is connected to OBS         |

Going live stops a trailer that is still playing.

### `live`: the overlays over the live picture

Everything shown over the live picture is in this one page, so it needs no
further browser sources; new overlays for the live picture go here too. It is
nested in `Pre-Live` as well, so show a banner only once the scene is `live`.

**`mode`**: red dot and "LIVE", top right

| `mode` | Effect                                                                        |
| ------ | ----------------------------------------------------------------------------- |
| `off`  | Letters slide up and fade out one by one, then the dot fades (initial state)  |
| `on`   | Dot appears, then the letters drop in one by one                              |

**`banner`**: lower third with name and role, bottom left. The texts are in
`BANNERS` in `public/overlays/live.html`.

| `banner` | Shows                                                 |
| -------- | ----------------------------------------------------- |
| `off`    | Nothing (initial state)                               |
| `priest` | Dr. Zvonko Brezovski, Pfarrer, Pfarre Emmaus am Wienerberg |
| `mother` | Antonia Salzano Acutis, Mutter des hl. Carlo Acutis   |

The role line changes language every 3 seconds (German, Croatian, Italian,
English; `ROLE_MS`) and the panel keeps the width of the longest one.

The panel wipes open from the left, then name and role rise; hiding reverses
it. Switching between two banners hides the first before the second comes in.
While a banner is shown the LIVE indicator is shown too, even with `mode`
`off`; it goes again with the banner. A banner hides itself after 12 seconds, once every language has shown
(`BANNER_MS` in `main.ts`); show it again when the person appears again.

**`reading`**, **`cue`**, **`step`**: subtitles for the readings, a band
across the bottom with the current cue in German, Croatian, Italian and
English, one row each. The texts are in `content/readings.ts`, split into
sense lines that are aligned across the languages. `readings.set` picks the
texts behind `first` and `gospel` (`READING_SETS`): `actual` is the Carlo
Acutis Mass (Isaiah 61, Matthew 12), `test` the test Mass on Sunday,
15 November 2026, St. Leopold (Proverbs 3, Luke 19). On the control page it is
the deliberately tiny "Readings: Mass / Test" switch at the top right, so it is
not hit by accident during the live Mass; in test mode the whole page turns blue. Switching
turns off a reading that is on screen.

| Field     | Values                       | Effect                                                    |
| --------- | ---------------------------- | --------------------------------------------------------- |
| `reading` | `off`, `first`, `gospel`     | Shows that reading of the current set from its Bible reference; choosing it again restarts it (the gospel is read twice) |
| `cue`     | `0` …                        | Read-only: `0` is the Bible reference, `1` the announcement, then the lines |
| `step`    | `prev`, `next`               | Moves one cue; `next` after the last cue hides the band, `prev` stops at the reference |

Each row is the whole reading on one line that scrolls left continuously; the
point being read sits at 40% of the width (`ANCHOR` in `live.html`), with what
was just read to its left and what comes next to its right. Every line scrolls
in its own time, estimated from its length (`CHARS_PER_SECOND`), and each
language at its own speed so the rows stay on the same line. When the operator
steps, the scroll re-times instead of jumping: it catches up smoothly if the
reader is ahead and comes to rest at the end of the line if the reader is
slower. Choosing a reading again fades the text out and starts over (the gospel
is read twice). Each reading starts with only its Bible reference ("Matthäus
12,46-50", with "Evangelium" small above it), larger, rotating through the four languages every 2.5 seconds
(`REFERENCE_MS`) while the rows are hidden. The first `next` fades over to the
announcement ("Aus dem heiligen Evangelium nach Matthäus"), which stands still at the left edge; the scroll
starts with the following `next`, and over the first line the reading point moves
out to `ANCHOR`.

**Following the reader**: while a reading is on, the control page shows it at
the top: the line being read and, in a blue box, the next line in all four
languages. Press "Next line" (or →, Page Down, so a presenter clicker works)
the moment the reader starts the line in the blue box; ← or Page Up goes back.
`step=next` on a Stream Deck key does the same.

**`communion`**: during communion the stream shows only a b-roll image (nobody
receiving is shown), and this lays a card over it in the parish teal, under the
LIVE dot and the other overlays. The texts are in `content/communion.ts`.

| `communion` | Shows                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| `off`       | Nothing (initial state)                                                   |
| `prayer`    | The act of spiritual communion in all four languages at once, in a 2×2 grid |
| `carlo`     | "Die Eucharistie ist meine Autobahn in den Himmel", large on the left; the language changes every 25 seconds (`CARLO_MS`) with a fade |

Start with `prayer` when communion begins and switch to `carlo` for the rest of
it; the cards crossfade.

### `prelive`: the pre-live screen

The left column shows title, date, celebrant, a welcome for Carlo's mother and
the Mass languages, cycling through English, German, Croatian and Italian every
8 seconds, with the parish logo, name and place at the bottom. Under the camera
is the documentary about Carlo Acutis (English with one rotating language
beneath) and its website. The countdown ("Live broadcast is starting in N
minutes", English only) sits in the top-left corner of the camera frame and
stays visible in every pre-live mode, including the trailer. When `obs.scene`
becomes `live`, the hole around the camera opens to full screen and everything
else clears away; back to `prelive` reverses it.

| Field        | Default                           | Effect                                                                                       |
| ------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| `screen`     | `before`                          | Which left column and pill: `before` the Mass, a `pause` (before the meeting with Carlo's mother) or the `end` |
| `startTime`  | Mass start from `livestream.ts`   | Today's broadcast start for the countdown; "starting shortly" once it has passed             |
| `resumeTime` | Meeting start from `livestream.ts` | Where the pause counts down to ("The broadcast continues in N minutes")                     |
| `trailer`   | `off`                           | `play` shows the trailer in the camera frame with Croatian, Italian and English subtitles; back to `off` when it ends |
| `music`     | `off`                           | `play` fades in `public/media/music.mp3`, looped; it fades out while the trailer plays and back in after it; going live stops it |

Title and date come from `app/carlo/i18n.ts` and `app/carlo/livestream.ts`, the
same source as the website's `/carlo` page; the other texts are in
`content/prelive.ts`. Text uses three sizes, set as variables
at the top of the stylesheet; the font is the site's Source Sans 3.

**Smallest text**: 32px at 1920×1080 on every overlay (26px was the smallest
still legible in the stream). Translations rotate through the languages in place
rather than appearing as smaller lines; the film block under the frame does the
same as the left column.

**Pause and end**: switch OBS back to `prelive` and set `screen`. The camera
frame, film block and parish stay; the left column crossfades. The pause shows
"Gleich geht es weiter", the meeting at 17:00 and a countdown to `resumeTime`;
the end shows the thanks and that the recording will be on emmaus.wien/carlo,
with "Thank you for watching" in the pill. It leaves out the evening's film
screening: viewers who could go are in Vienna and most likely there already.

Each rotating line keeps the height of its tallest language (all languages are
laid out invisibly in the same cell), so nothing below it moves when the
language changes.

**Media files**: `public/media/` is not in git. Both files are attached to the
GitHub release `broadcast-media`; on the streaming Mac, from the repo root:

```bash
gh release download broadcast-media --repo wolkoman/emmaus --dir broadcast/public/media --clobber
```

**Music**: `public/media/music.mp3`; any MP3 works.

**Trailer**: `public/media/trailer.mp4` is Kinostar's 50-second German
trailer, originally fetched with
`yt-dlp -f "bv*[height<=1080][vcodec^=avc1]+ba[ext=m4a]" --merge-output-format mp4
-o broadcast/public/media/trailer.mp4 https://www.youtube.com/watch?v=zpvVgU0mSxw`
(H.264, which OBS's browser plays). It is narrated in German, so
`content/trailer.ts` holds Croatian, Italian and English subtitles, timed from
YouTube's automatic German captions.

## Extending

**A field or section**: add it to the schema in `main.ts` (`choice([...])` or
`time("17:00")`). Validation, the control page and the HTTP URLs follow. A
command such as `next` is a `choice([...], { action: true })` handled in
`OWNED_FIELDS`; the control page shows its buttons without marking one active.

**An overlay**: create `public/overlays/<name>.html` with a transparent
background; `connect({ on: { state } })` from `/overlay-client.js` gives it the
state. To put it on air, add it as another frame in `overlays/main.html` (later
frames lie on top) rather than as a new OBS browser source.

**An outside system** (like OBS, later the ATEM): a module in `server/` that
connects, reconnects by itself and reports through callbacks. In `main.ts` its
reports become `store.apply(...)`. Fields only it can change (status, tally) are
`readOnly`; fields clients may change but it carries out (like `obs.scene`) go
into `OWNED_FIELDS`, which `set()` routes to it.

**Animation**: animate every visible state change, at least with a short fade:
on air a hard cut looks like a glitch. For changing text use
`morphText(el, text)` from `/morph-text.js`, which swaps it character by
character from left to right (timing in the constants at the top of that file).
Camera switching is OBS's job, not the overlays'.

## Security

- Other devices need `ACCESS_KEY`; without it set, only the Mac itself can
  connect. Everyone with the key can do everything the control page can,
  including switching OBS scenes; there are no roles.
- On the Mac there is no check: any web page open in a browser there can send a
  GET to the set URLs (the WebSocket checks the origin, the Stream Deck URLs
  can't). Keep `HOST` on `127.0.0.1` when no phones are needed, and use a
  trusted network.
