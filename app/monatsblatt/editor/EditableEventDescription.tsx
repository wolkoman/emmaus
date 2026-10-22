"use client";

import {
  EventDescriptionRenderer,
  hasEventDescriptionText,
  sanitizeEventDescription,
} from "@/app/monatsblatt/FlyerTiles";
import { useMonthlyEditorStore } from "@/app/monatsblatt/editor/store";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/util/utils";
import { PiPencilSimpleFill } from "react-icons/pi";

/**
 * Editable event description. Overrides are stored per event as
 * `customEventDescription` and travel with the issue data, so the calendar
 * entry itself stays untouched.
 *
 * Two Monatsblatt specifics:
 *  - The box is edited as HTML (uncontrolled `dangerouslySetInnerHTML` +
 *    `contentEditable`), because descriptions may carry inline emphasis and
 *    print renders that markup. Editing plain text would make the editor
 *    preview — and therefore the events-flow measurement — disagree with the
 *    print render.
 *  - Changes are committed on blur, not per keystroke: a store write
 *    invalidates the events-flow distribution, which unmounts and remounts the
 *    day groups (and would drop the caret on every character).
 *  - An emptied description leaves no box behind (print shows nothing either),
 *    only the marker that offers to restore the calendar text.
 */
export const renderEditableEventDescription: EventDescriptionRenderer = (
  props,
) => <EditableEventDescription key={props.event.id} {...props} />;

function EditableEventDescription(props: {
  event: { id: string; description?: string };
  description: string;
  className: string;
}) {
  const store = useMonthlyEditorStore();
  const original = sanitizeEventDescription(
    props.event.description ?? "",
  ).trim();
  const isCustom =
    sanitizeEventDescription(props.description).trim() !== original;

  function commit(element: HTMLElement) {
    const html = sanitizeEventDescription(element.innerHTML).trim();
    const value = hasEventDescriptionText(html) ? html : "";
    // Normalize the DOM to what will be stored (and printed): the browser
    // leaves block wrappers etc. behind that the sanitizer strips.
    element.innerHTML = value;
    store.setCustomDescription(
      props.event.id,
      value === original ? undefined : value,
    );
  }

  const hasText = hasEventDescriptionText(props.description);
  if (!hasText && !isCustom) return null;

  return (
    // An emptied description takes no space: print renders nothing here, and
    // the events flow measures this preview.
    <div className={cn("relative", !hasText && "h-0")}>
      {hasText && (
        <div
          className={cn(
            props.className,
            "rounded-sm outline-none focus:bg-yellow-50",
          )}
          contentEditable
          suppressContentEditableWarning
          title="Beschreibung bearbeiten"
          onBlur={(event) => commit(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.blur();
            // Keep line breaks as <br>; a block wrapper would be stripped on
            // commit and the break would silently disappear in print.
            if (event.key === "Enter") {
              event.preventDefault();
              document.execCommand("insertLineBreak");
            }
          }}
          dangerouslySetInnerHTML={{
            __html: sanitizeEventDescription(props.description),
          }}
        />
      )}
      {isCustom && (
        <Popover>
          <PopoverTrigger
            className="absolute top-0 right-0 rounded-full bg-white/80 p-0.5 text-black/40 opacity-0 group-hover/event:opacity-100 hover:text-black focus-visible:opacity-100 data-[state=open]:opacity-100 print:hidden"
            title="Beschreibung wurde geändert"
          >
            <PiPencilSimpleFill />
          </PopoverTrigger>
          <PopoverContent className="flex w-64 flex-col gap-2 p-3 text-xs">
            <div className="font-semibold">Original aus dem Kalender</div>
            {original ? (
              <div dangerouslySetInnerHTML={{ __html: original }} />
            ) : (
              <div className="opacity-60">(keine Beschreibung)</div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                store.setCustomDescription(props.event.id, undefined)
              }
            >
              Zurücksetzen
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
