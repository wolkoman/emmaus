import { formatDate, formatTime } from "@/app/(shared)/Localization";
import { CalendarGroup } from "@/domain/events/CalendarGroup";
import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { loadCachedEvents } from "@/domain/events/EventsLoader";
import { cacheLife } from "next/dist/server/use-cache/cache-life";

async function loadUpcomingMasses(count: number) {
  "use cache";
  cacheLife("hours");
  const { events } = await loadCachedEvents({ access: EventLoadAccess.PUBLIC });
  return events
    .filter((event) => event.groups.includes(CalendarGroup.Messe))
    .slice(0, count);
}

export async function NextMassPill() {
  const [next] = await loadUpcomingMasses(1);
  if (!next) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
      Nächste Messe:{" "}
      {formatDate(next.date, {
        weekday: "short",
        day: "numeric",
        month: "numeric",
      })}
      , {formatTime(next.start.dateTime)} Uhr
    </div>
  );
}

export async function UpcomingMassList() {
  const masses = await loadUpcomingMasses(5);
  if (masses.length === 0) {
    return (
      <div className="opacity-70">Aktuell sind keine Termine geplant.</div>
    );
  }
  return (
    <div className="flex flex-col divide-y divide-black/5">
      {masses.map((mass) => (
        <div key={mass.id} className="flex items-baseline gap-4 py-3">
          <div className="w-24 shrink-0 font-semibold">
            {formatDate(mass.date, {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            })}
          </div>
          <div className="text-emmaus w-14 shrink-0 font-semibold">
            {formatTime(mass.start.dateTime)}
          </div>
          <div className="min-w-0 truncate">{mass.summary}</div>
        </div>
      ))}
    </div>
  );
}
