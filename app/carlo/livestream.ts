/** The Carlo Acutis event on /carlo: the Mass livestream; texts are in i18n.ts. */
export const LIVESTREAM = {
  // UTC, so the countdown doesn't depend on the viewer's time zone (16:00 in Vienna).
  start: "2026-11-21T15:00:00Z",
  // YouTube links (watch, youtu.be, /live/) are embedded; other links only get the button.
  streamUrl: "",
  recordingUrl: "",
};

/** After this, /carlo thanks viewers and the language banner disappears. */
export const LIVESTREAM_ENDS_AFTER = 3 * 60 * 60 * 1000;

/** UTC times of the programme after the Mass (17:00 and 19:00 in Vienna). */
export const MEETING_START = "2026-11-21T16:00:00Z";
export const FILM_START = "2026-11-21T18:00:00Z";

/** Ticket shop for the film premiere; while empty the page says tickets are coming soon. */
export const TICKET_URL = "https://www.megaplex.at/film/gasometer/carlo-acutis";
