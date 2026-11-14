// YouTube links (watch, youtu.be, /live/) are embedded; other links only get the button.
const STREAM_URL = "https://www.youtube.com/watch?v=CoK1opEfoUc";

/** The Carlo Acutis event on /carlo: the Mass livestream; texts are in i18n.ts. */
export const LIVESTREAM = {
  // UTC, so the countdown doesn't depend on the viewer's time zone (16:00 in Vienna).
  start: "2026-11-21T15:00:00Z",
  streamUrl: STREAM_URL,
  // A YouTube live video stays at its address as the recording afterwards.
  recordingUrl: STREAM_URL,
};

/** After this, /carlo thanks viewers and the language banner disappears. */
export const LIVESTREAM_ENDS_AFTER = 3 * 60 * 60 * 1000;

/** UTC times of the programme after the Mass (17:00, and the film at 19:00 and 19:20 in Vienna). */
export const MEETING_START = "2026-11-21T16:00:00Z";
// The cinema added the 19:20 screening in a second room after 19:00 sold out.
export const FILM_STARTS = ["2026-11-21T18:00:00Z", "2026-11-21T18:20:00Z"];

/** Ticket shop for the film premiere; while empty the page says tickets are coming soon. */
export const TICKET_URL = "https://www.megaplex.at/film/gasometer/carlo-acutis";

/** Public transport route from the parish to the cinema (Google Maps directions URL). */
export const ROUTE_URL =
  "https://www.google.com/maps/dir/?api=1&origin=Tesarekplatz%202%2C%201100%20Wien&destination=Hollywood%20Megaplex%20Gasometer%2C%20Guglgasse%2011%2C%201110%20Wien&travelmode=transit";
