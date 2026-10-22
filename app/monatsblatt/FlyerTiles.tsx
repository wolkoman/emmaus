import { prettifyEventSummary } from "@/app/(domain)/events/event-display";
import { articleIcon, TILE_ICONS } from "@/app/monatsblatt/tileIcons";
import { FLYER_TEXT } from "@/app/monatsblatt/typography";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import sanitize from "sanitize-html";
import { formatDate } from "@/app/(shared)/Localization";
import { CalendarGroup } from "@/domain/events/CalendarGroup";
import { CrosswordWord, MonthlyData } from "@/app/monatsblatt/editor/store";
import { createCrosswordLayout } from "@/app/monatsblatt/crossword";
import { SanitizeHTML } from "@/components/SanitizeHtml";
import { Liturgy } from "@/domain/liturgy/liturgy-data";
import {
  isDisplayedLiturgy,
  isSpecialLiturgyDay,
  liturgyDayName,
  pickDayLiturgy,
} from "@/domain/liturgy/liturgy-order";
import { cn } from "@/util/utils";

/**
 * Read-only tile renderers for the Monatsblatt flyer. Server-safe (no hooks,
 * no browser APIs) so the print route can render them directly; the editor
 * wraps/replaces them with interactive variants (EditorTile).
 */

/**
 * Unified tile heading: all-caps with a leading icon in emmaus green and an
 * eyebrow rule filling the remaining space right of the title.
 */
export function TileHeading(props: { icon?: IconType; children: ReactNode }) {
  const Icon = props.icon;
  return (
    <div className={cn(FLYER_TEXT.heading, "flex items-center gap-1.5")}>
      {Icon && <Icon className="shrink-0" aria-hidden />}
      <span className="min-w-0">{props.children}</span>
      <span
        aria-hidden
        className="h-px min-w-4 grow rounded-full bg-black/30"
      />
    </div>
  );
}

export function ArticleView(props: {
  title: string;
  text: string;
  icon?: string;
}) {
  return (
    <div className="flex break-inside-avoid flex-col gap-2">
      <TileHeading icon={articleIcon(props.icon)}>{props.title}</TileHeading>
      {/* `!` needed: .custom-html p { margin } in globals.css is unlayered
          and therefore beats plain (layered) utilities. Keep in sync with
          the editor tile so print matches the editor. */}
      <SanitizeHTML className="[&_p]:my-0!" html={props.text} />
    </div>
  );
}

/**
 * "Gebetsanliegen des Papstes": the monthly papal prayer intention,
 * maintained in the `papal_intentions` PB collection and snapshotted into
 * the issue data when events are loaded. Styled as an outlined card so it
 * stands out from the surrounding announcement tiles.
 */
export function PapalIntentionView(props: {
  intention: { title: string; text: string } | null;
  month: string;
}) {
  if (!props.intention?.text) {
    return (
      <div className="rounded-md bg-red-100 px-2 py-1 text-red-800 print:hidden">
        Kein Gebetsanliegen für {props.month || "diesen Monat"} hinterlegt —
        bitte in Pocketbase (papal_intentions) pflegen und Termine neu laden.
      </div>
    );
  }
  return (
    <div className="border-emmaus/30 relative break-inside-avoid overflow-hidden rounded-xl border p-3 pt-4">
      {/* Oversized decorative quote mark, clipped by the card. */}
      <div
        aria-hidden
        className="text-emmaus/20 absolute -top-5 -right-1 font-serif text-7xl leading-none select-none"
      >
        „
      </div>
      <div className="text-emmaus text-[0.86em] font-semibold tracking-widest uppercase">
        Gebetsanliegen des Papstes
      </div>
      <div className={cn(FLYER_TEXT.heading, "mt-0.5")}>
        {props.intention.title}
      </div>
      <div className="mt-1 italic">{props.intention.text}</div>
    </div>
  );
}

/**
 * Image tile: no heading, spans the panel width. The height chosen in the
 * editor is a cap, not a fixed box — the tile hugs the picture, so a wide
 * image doesn't sit between paper-white bars. Only when the cap bites does
 * object-contain letterbox the picture (then sideways, keeping it complete).
 * Renders nothing in print while no image is uploaded.
 */
export function ImageView(props: { url: string; heightMm: number }) {
  if (!props.url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.url}
      alt=""
      className="w-full object-contain"
      style={{ maxHeight: `${props.heightMm}mm` }}
    />
  );
}

/**
 * Kreuzworträtsel tile. The layout is recomputed from the word list on every
 * render — the generator is deterministic (greedy, no randomness), so the
 * editor preview and the print route always show the same grid. Words the
 * generator cannot place are listed in an editor-only warning
 * (`showUnplacedWarning`); print silently omits them.
 */
export function CrosswordView(props: {
  words: CrosswordWord[];
  showUnplacedWarning?: boolean;
}) {
  const words = props.words.filter((w) => w.answer.trim() && w.clue.trim());
  const layout = createCrosswordLayout(words);
  const placed = layout.result.filter((w) => w.orientation !== "none");
  const unplaced = layout.result.filter((w) => w.orientation === "none");
  // Clue number per start cell ("row,col" → position).
  const numbers = new Map<string, number>();
  for (const word of placed)
    numbers.set(`${word.starty},${word.startx}`, word.position!);
  const across = placed
    .filter((w) => w.orientation === "across")
    .sort((a, b) => a.position! - b.position!);
  const down = placed
    .filter((w) => w.orientation === "down")
    .sort((a, b) => a.position! - b.position!);

  return (
    <div className="flex break-inside-avoid flex-col gap-2">
      <TileHeading icon={TILE_ICONS.CROSSWORD}>Kreuzworträtsel</TileHeading>
      {placed.length > 0 && (
        <div
          // Fluid: the grid fills the panel width; cells stay square via
          // aspect-square, so cell size adapts to the number of columns.
          // Adjacent cells overlap by 1px (-mt/-ml) so their borders
          // collapse into a single connected line; the padding compensates
          // for the first row/column shifting out of the box.
          className="grid w-full pt-px pl-px"
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
          }}
        >
          {layout.table.flatMap((row, i) =>
            row.map((cell, j) =>
              cell === "-" ? (
                <div key={`${i},${j}`} className="aspect-square" />
              ) : (
                <div
                  key={`${i},${j}`}
                  className="relative -mt-px -ml-px aspect-square border border-black/60 bg-white"
                >
                  {numbers.has(`${i + 1},${j + 1}`) && (
                    <span className="absolute top-px left-0.5 text-[0.72em] leading-none">
                      {numbers.get(`${i + 1},${j + 1}`)}
                    </span>
                  )}
                </div>
              ),
            ),
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-3 text-[0.82em] leading-snug">
        <div>
          <div className="font-semibold">Waagrecht</div>
          {across.map((w) => (
            <div key={`a${w.position}`}>
              {w.position}. {w.clue}
            </div>
          ))}
        </div>
        <div>
          <div className="font-semibold">Senkrecht</div>
          {down.map((w) => (
            <div key={`d${w.position}`}>
              {w.position}. {w.clue}
            </div>
          ))}
        </div>
      </div>
      {props.showUnplacedWarning && unplaced.length > 0 && (
        <div className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-800 print:hidden">
          Nicht unterbringbar: {unplaced.map((w) => w.answer).join(", ")} —
          Wörter brauchen gemeinsame Buchstaben.
        </div>
      )}
    </div>
  );
}

/**
 * "Folgen Sie uns auf Instagram": static social media card, styled like the
 * papal intention card (outlined, decorative oversized icon) so the two
 * accent tiles share one visual language.
 */
export function InstagramView() {
  const Logo = TILE_ICONS.INSTAGRAM;
  return (
    <div className="border-emmaus/30 relative break-inside-avoid overflow-hidden rounded-xl border p-3 pt-4">
      {/* Oversized decorative logo, clipped by the card. */}
      <Logo
        aria-hidden
        className="text-emmaus/20 absolute -top-3 -right-3 size-16"
      />
      <div className="text-emmaus text-[0.86em] font-semibold tracking-widest uppercase">
        Folgen Sie uns auf Instagram
      </div>
      <div className={cn(FLYER_TEXT.heading, "mt-0.5")}>@pfarreemmaus</div>
      <div className="mt-1">
        Fotos und Neuigkeiten aus dem Pfarrleben – instagram.com/pfarreemmaus
      </div>
    </div>
  );
}

/**
 * Event descriptions come from calendar entries (Google Calendar et al.) and
 * may contain HTML. Render it, but sanitized down to plain inline emphasis —
 * no links (this is a print document) and nothing block-level or media.
 * Disallowed tags keep their text content (an <a> becomes its label).
 *
 * Also used by the editor to normalize what a user typed into a description
 * before it is stored, so the editor preview and the print render agree.
 */
export function sanitizeEventDescription(html: string): string {
  return sanitize(html, {
    allowedTags: ["strong", "b", "em", "i", "u", "br"],
    allowedAttributes: {},
  });
}

/**
 * Whether a description still carries visible text. Markup alone doesn't
 * count: clearing a contentEditable box leaves a stray <br> behind, and that
 * would otherwise print as an empty line under the event.
 */
export function hasEventDescriptionText(html: string): boolean {
  return (
    sanitize(html, { allowedTags: [], allowedAttributes: {} }).trim() !== ""
  );
}

/** Where readers send content for the next issue. */
export const ISSUE_CONTENT_MAIL = "monatsblatt@emmaus.wien";

/**
 * Editorial deadline of the next issue: the second-to-last Sunday of this
 * issue's main month ("YYYY-MM") — returned as "YYYY-MM-DD". Every month has
 * at least four Sundays, so this always exists for a valid month.
 */
export function editorialDeadline(month: string): string | undefined {
  if (!/^\d{4}-\d{2}$/.test(month)) return undefined;
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const sundays: number[] = [];
  // Walk backwards from the last day; the second hit is the one we want.
  for (
    let day = new Date(year, monthIndex + 1, 0).getDate();
    day >= 1 && sundays.length < 2;
    day--
  ) {
    if (new Date(year, monthIndex, day).getDay() === 0) sundays.push(day);
  }
  const day = sundays[1];
  return day ? `${month}-${String(day).padStart(2, "0")}` : undefined;
}

/**
 * Mandatory issue information, printed on every issue: how current the event
 * list is and when/where to send content for the next one. Shared by the
 * flyer's Rückseite (IssueInfoView) and the poster footer, so both always
 * state the same thing.
 */
export function issueInfo(data: MonthlyData): {
  deadline?: string;
  eventsAsOf?: string;
} {
  const deadline = editorialDeadline(data.month);
  return {
    deadline: deadline
      ? formatDate(deadline, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : undefined,
    // Fixed time zone: the print route renders on a UTC server, the editor in
    // the reader's browser — both must show Vienna time.
    eventsAsOf: data.eventsFetchedAt
      ? new Date(data.eventsFetchedAt).toLocaleString("de-AT", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Vienna",
        })
      : undefined,
  };
}

/**
 * Issue information as a tile-styled block for the flyer's Rückseite. Not a
 * MonthlyTile: it is mandatory content and therefore placed by FlyerSheet, not
 * by the editor.
 */
export function IssueInfoView(props: { data: MonthlyData }) {
  const { deadline, eventsAsOf } = issueInfo(props.data);
  return (
    <div className="flex break-inside-avoid flex-col gap-1 border-t border-black pt-2 leading-3">
      <div>
        Nächster Redaktionsschluss:{" "}
        <span className="font-semibold">{deadline}</span>
      </div>
      <div>
        Beiträge und Termine bitte an{" "}
        <span className="font-semibold">{ISSUE_CONTENT_MAIL}</span>
      </div>
      <div>Termine Stand: {eventsAsOf}</div>
    </div>
  );
}

/**
 * "Evangelien des Monats": gospel verse references for the issue's event
 * days. A liturgy the planner assigned to an event in the liturgical duty
 * plan (`event.liturgyName`, picked in /liturgische-dienste) always wins;
 * days without an assignment fall back to the day's top displayed liturgy
 * (Sundays, Hochfeste, Feste — same pick as the events list). Multiple
 * masses on a day that share the same liturgy collapse into one line.
 */
export function evangelienDays(
  events: MonthlyData["events"],
  liturgies: Liturgy[],
): { date: string; liturgy: Liturgy }[] {
  return (events ?? [])
    .map((event) => {
      const assigned = event.liturgyName
        ? liturgies.find(
            (l) => l.date === event.date && l.name === event.liturgyName,
          )
        : undefined;
      const fallback = pickDayLiturgy(liturgies, event.date);
      return {
        date: event.date,
        liturgy:
          assigned ??
          (isDisplayedLiturgy(fallback, event.date) ? fallback : undefined),
      };
    })
    .filter(
      (entry): entry is { date: string; liturgy: Liturgy } =>
        !!entry.liturgy?.evangelium,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter(
      (entry, i, arr) =>
        arr.findIndex(
          (x) => x.date === entry.date && x.liturgy.name === entry.liturgy.name,
        ) === i,
    );
}

export function EvangelienView(props: {
  events: MonthlyData["events"];
  liturgies: Liturgy[];
}) {
  const days = evangelienDays(props.events, props.liturgies);

  return (
    <div className="flex break-inside-avoid flex-col gap-2">
      <TileHeading icon={TILE_ICONS.EVANGELIEN}>
        Evangelien des Monats
      </TileHeading>
      <div className="opacity-60">
        Vorher gelesen, wird das Wort im Gottesdienst vertrauter. Nachher
        gelesen, begleitet es durch die Woche.
      </div>
      {/* Content-sized columns (no magic widths): weekday | date | verse |
          feast name, each aligned across all rows. */}
      <div className="grid grid-cols-[auto_auto_auto_1fr] gap-x-2 gap-y-1">
        {days.map(({ date, liturgy }) => (
          <div className="contents" key={date + liturgy.name}>
            <div
              className={cn(
                isSpecialLiturgyDay(liturgy, date) && "font-semibold",
              )}
            >
              {formatDate(date, { weekday: "short" })}
            </div>
            <div
              className={cn(
                "whitespace-nowrap",
                isSpecialLiturgyDay(liturgy, date) && "font-semibold",
              )}
            >
              {formatDate(date, { day: "2-digit", month: "2-digit" })}
            </div>
            <div>{liturgy.evangelium}</div>
            <div className="truncate opacity-50">{liturgyDayName(liturgy)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Styling of an event's description line — shared with the editor variant. */
const EVENT_DESCRIPTION_CLASS = "font-normal opacity-80";

/**
 * Editor hook: replaces the printed description with an editable one. Called
 * for every event, including those without a description (the editor still
 * offers to restore an emptied one). Must render a box of the same size as
 * print — nothing at all when there is no text — otherwise the events flow
 * would measure a layout the print render doesn't reproduce.
 */
export type EventDescriptionRenderer = (props: {
  event: MonthlyData["events"][number];
  /** Effective description: custom override if set, else the calendar text. */
  description: string;
  className: string;
}) => ReactNode;

/**
 * One day of the events list (weekday, date, liturgy, events). Rendered as a
 * self-contained block so the events flow (EventsFlow.tsx) can measure and
 * distribute days individually across panels.
 */
export function DayGroup(props: {
  dateString: string;
  events: MonthlyData["events"];
  liturgies: Liturgy[];
  renderDescription?: EventDescriptionRenderer;
}) {
  const { dateString, events } = props;
  const liturgyElement = pickDayLiturgy(props.liturgies, dateString);
  const isSpecial = isSpecialLiturgyDay(liturgyElement, dateString);
  const showLiturgy =
    isDisplayedLiturgy(liturgyElement, dateString) || isSpecial;

  // Column widths in em so the day list scales with the layout's base size
  // (16px / 36px / 1cm at the flyer's 13px body).
  return (
    <div className={cn("grid grid-cols-[1.25em_2.8em_auto] gap-x-1.5")}>
      <div className={cn(isSpecial && "text-emmaus font-semibold underline")}>
        {formatDate(dateString, { weekday: "short" })}
      </div>
      <div
        className={cn(
          "whitespace-nowrap",
          isSpecial && "text-emmaus font-semibold underline",
        )}
      >
        {formatDate(dateString, { day: "2-digit", month: "2-digit" })}
      </div>
      <div>
        {showLiturgy && (
          <div
            className={cn(
              // Past the time column, so the feast reads as a heading over the
              // event names instead of looking like a time.
              "pl-[2.9em] font-semibold",
              isSpecial && "text-emmaus underline",
            )}
          >
            {liturgyDayName(liturgyElement)}{" "}
            {liturgyElement?.rank ? `(${liturgyElement.rank})` : ""}
          </div>
        )}
        {events.map((event) => {
          const description =
            event.customEventDescription ?? event.description ?? "";
          return (
            <div
              key={event.id}
              className={cn(
                // group/event: the editor reveals its edit marker on row hover.
                "group/event mb-0.5 flex",
                // Masses are emphasized, matching the Wochenblatt.
                event.groups.includes(CalendarGroup.Messe) && "font-semibold",
              )}
            >
              {/* Time column — keep in sync with the liturgy line's indent. */}
              <div className="w-[2.9em] shrink-0">{event.time}</div>
              <div>
                <div className="flex flex-wrap gap-x-2">
                  <span>{prettifyEventSummary(event.summary)}</span>
                  {event.mainPerson && (
                    <span className="font-normal opacity-50">
                      {event.mainPerson}
                    </span>
                  )}
                </div>
                {props.renderDescription
                  ? props.renderDescription({
                      event,
                      description,
                      className: EVENT_DESCRIPTION_CLASS,
                    })
                  : hasEventDescriptionText(description) && (
                      <div
                        className={EVENT_DESCRIPTION_CLASS}
                        dangerouslySetInnerHTML={{
                          __html: sanitizeEventDescription(description),
                        }}
                      />
                    )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
