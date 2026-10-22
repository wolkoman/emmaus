"use client";

import { useMonthlyEditorStore } from "@/app/monatsblatt/editor/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Links } from "@/app/(shared)/Links";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PiArrowsClockwise,
  PiCalendarDots,
  PiCheck,
  PiFilePlus,
  PiFolderOpen,
  PiX,
} from "react-icons/pi";

type Version = { name: string; month: string; publishedAt: string };

function formatRange(range: { start: string; end: string }): string {
  if (!range.start || !range.end) return "";
  const format = (date: string) =>
    new Date(date + "T12:00").toLocaleDateString("de-AT", {
      day: "numeric",
      month: "short",
    });
  return `${format(range.start)} – ${format(range.end)}`;
}

/** First/last day of a "YYYY-MM" month, as the store's setMonth derives it. */
function monthRange(month: string): { start: string; end: string } {
  const lastDay = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate();
  return { start: `${month}-01`, end: `${month}-${lastDay}` };
}

export const MENUBAR_TRIGGER =
  "rounded-sm px-1.5 text-sm text-black/70 hover:bg-black/5 disabled:opacity-40 data-popup-open:bg-black/5";

/**
 * Document-style header: the open issue as title, a menu bar below it —
 * "Datei" (new/open issue), "Termine" (calendar range and refresh), plus
 * `children` (the "Veröffentlichen" menu).
 */
export function IssueMenu(props: { children?: React.ReactNode }) {
  const store = useMonthlyEditorStore();
  const router = useRouter();
  const [versions, setVersions] = useState<Version[]>([]);
  const [dialog, setDialog] = useState<
    { kind: "new" } | { kind: "range" } | { kind: "open"; name: string } | null
  >(null);

  async function open(name: string) {
    if (await store.hasUnsavedChanges()) setDialog({ kind: "open", name });
    else store.loadVersion(name);
  }

  return (
    <div className="flex min-w-0 flex-col">
      <div className="truncate px-1.5 text-sm font-semibold">
        {store.name ? `Monatsblatt ${store.name}` : "Keine Ausgabe geöffnet"}
      </div>
      <div className="flex items-center">
        <DropdownMenu
          onOpenChange={(isOpen) => {
            if (isOpen) store.getAll().then(setVersions);
          }}
        >
          <DropdownMenuTrigger render={<button className={MENUBAR_TRIGGER} />}>
            Datei
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuItem onClick={() => setDialog({ kind: "new" })}>
              <PiFilePlus /> Neue Ausgabe …
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <PiFolderOpen /> Öffnen
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 w-56">
                {versions.length === 0 && (
                  <DropdownMenuItem disabled>Keine Ausgaben</DropdownMenuItem>
                )}
                {versions.map((version) => (
                  <DropdownMenuItem
                    key={version.name}
                    onClick={() => open(version.name)}
                  >
                    <PiCheck
                      className={version.name === store.name ? "" : "invisible"}
                    />
                    {version.name}
                    <span className="ml-auto text-xs text-black/40">
                      {version.publishedAt
                        ? new Date(version.publishedAt).toLocaleDateString(
                            "de-AT",
                            { day: "2-digit", month: "2-digit" },
                          )
                        : "Entwurf"}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            {/* The draft stays in local storage, so closing loses nothing. */}
            <DropdownMenuItem onClick={() => router.push(Links.Intern)}>
              <PiX /> Schließen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={!store.name}
            render={<button className={MENUBAR_TRIGGER} />}
          >
            Termine
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-black">
                  {formatRange(store.dateRange)}
                </span>
                {store.eventsFetchedAt
                  ? `Stand: ${new Date(store.eventsFetchedAt).toLocaleString(
                      "de-AT",
                      {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}`
                  : "Noch nicht aus dem Kalender geladen"}
              </DropdownMenuLabel>
              <DropdownMenuItem
                disabled={store.loading}
                onClick={() => store.loadRange()}
              >
                <PiArrowsClockwise /> Aus dem Kalender aktualisieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialog({ kind: "range" })}>
                <PiCalendarDots /> Zeitraum ändern …
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {props.children}
      </div>

      {dialog?.kind === "new" && (
        <NewIssueDialog onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "range" && (
        <RangeDialog onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "open" && (
        <Dialog open onOpenChange={(isOpen) => !isOpen && setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialog.name === store.name
                  ? `„${dialog.name}“ neu laden?`
                  : `„${dialog.name}“ öffnen?`}
              </DialogTitle>
              <DialogDescription>
                „{store.name}“ hat nicht veröffentlichte Änderungen, die dabei
                ersetzt werden. Mit Rückgängig lassen sie sich wiederherstellen.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  store.loadVersion(dialog.name);
                  setDialog(null);
                }}
              >
                {dialog.name === store.name ? "Neu laden" : "Öffnen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function DateRangeFields(props: {
  range: { start: string; end: string };
  onChange: (range: { start: string; end: string }) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      Zeitraum der Termine
      <div className="flex gap-2">
        <input
          type="date"
          className="w-1/2 rounded-md border p-2 font-normal"
          value={props.range.start}
          onChange={(e) =>
            props.onChange({ ...props.range, start: e.target.value })
          }
        />
        <input
          type="date"
          className="w-1/2 rounded-md border p-2 font-normal"
          value={props.range.end}
          onChange={(e) =>
            props.onChange({ ...props.range, end: e.target.value })
          }
        />
      </div>
    </label>
  );
}

const MONTH_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: new Date(2000, i, 1).toLocaleDateString("de-AT", { month: "long" }),
}));

/** The month after today's, as "YYYY-MM": the usual next issue. */
function nextMonth(): string {
  const today = new Date();
  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function NewIssueDialog(props: { onClose: () => void }) {
  const store = useMonthlyEditorStore();
  // Selects instead of <input type="month">: browsers without a month picker
  // fall back to free text, which once saved an issue as "Invalid Date".
  const [month, setMonth] = useState(nextMonth);
  const [range, setRange] = useState(() => monthRange(month));
  const thisYear = new Date().getFullYear();
  const yearItems = [thisYear - 1, thisYear, thisYear + 1].map((year) => ({
    value: String(year),
    label: String(year),
  }));

  function pick(next: string) {
    setMonth(next);
    // Default the range to the month; still adjustable below.
    setRange(monthRange(next));
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && props.onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Ausgabe</DialogTitle>
          <DialogDescription>
            {store.name
              ? `Kacheln und Texte werden aus „${store.name}“ übernommen, die Termine neu geladen.`
              : "Die Termine des Zeitraums werden aus dem Kalender geladen."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1 text-sm font-medium">
          Monat
          <div className="flex gap-2 font-normal">
            <Select
              items={MONTH_ITEMS}
              value={month.slice(5, 7)}
              onValueChange={(value) =>
                value && pick(`${month.slice(0, 4)}-${value}`)
              }
            >
              <SelectTrigger aria-label="Monat" className="w-1/2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={yearItems}
              value={month.slice(0, 4)}
              onValueChange={(value) =>
                value && pick(`${value}-${month.slice(5, 7)}`)
              }
            >
              <SelectTrigger aria-label="Jahr" className="w-1/2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DateRangeFields range={range} onChange={setRange} />
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Abbrechen
          </Button>
          <Button
            disabled={!range.start || !range.end}
            onClick={() => {
              store.setMonth(month);
              store.setDateRange(range);
              store.loadRange();
              props.onClose();
            }}
          >
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RangeDialog(props: { onClose: () => void }) {
  const store = useMonthlyEditorStore();
  const [range, setRange] = useState(store.dateRange);

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && props.onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zeitraum ändern</DialogTitle>
          <DialogDescription>
            Z. B. bis 6. Jänner, damit die Dezember-Ausgabe die Weihnachtszeit
            abdeckt. Die Termine werden danach neu geladen.
          </DialogDescription>
        </DialogHeader>
        <DateRangeFields range={range} onChange={setRange} />
        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>
            Abbrechen
          </Button>
          <Button
            disabled={!range.start || !range.end}
            onClick={() => {
              store.setDateRange(range);
              store.loadRange();
              props.onClose();
            }}
          >
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
