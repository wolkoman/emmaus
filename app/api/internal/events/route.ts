import { EventLoadAccess } from "@/domain/events/EventLoadOptions";
import { CalendarTag } from "@/domain/events/EventMapper";
import { loadCachedEvents } from "@/domain/events/EventsLoader";
import { getTimeOfEvent } from "@/domain/events/EventSorter";
import { NextResponse } from "next/server";

// Internal API for the WhatsApp assistant. Returns public events.
// Network-isolated via Traefik (see ingress-block-internal.yaml). Reachable
// in-cluster as http://emmaus:5557/api/internal/events.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const days = Math.min(
      Math.max(parseInt(url.searchParams.get("days") ?? "14", 10) || 14, 1),
      90,
    );
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") ?? "30", 10) || 30, 1),
      200,
    );
    const q = url.searchParams.get("q")?.toLowerCase().trim() || "";

    const { events } = await loadCachedEvents({
      access: EventLoadAccess.PUBLIC,
    });

    const now = Date.now();
    const horizon = now + days * 24 * 60 * 60 * 1000;

    const filtered = events
      .filter((e) => !e.tags.includes(CalendarTag.cancelled))
      .filter((e) => {
        const t = getTimeOfEvent(e);
        return t >= now && t <= horizon;
      })
      .filter((e) =>
        q ? (e.summary + " " + e.description).toLowerCase().includes(q) : true,
      )
      .slice(0, limit)
      .map((e) => ({
        id: e.id,
        summary: e.summary,
        description: e.description,
        date: e.date,
        time: e.time,
        wholeday: e.wholeday,
        start: e.start?.dateTime ?? null,
        end: e.end?.dateTime ?? null,
        groups: e.groups,
        // Liturgy roster (Lektor:innen, Ministrant:innen, Musik, Mesner)
        // attached by loadCachedEvents; for PUBLIC access the loader already
        // filters to status=Informed and shortens names.
        roster: (e.roster ?? []).map((r) => ({
          name: r.userName,
          position: r.position,
          status: r.status,
        })),
      }));

    return NextResponse.json(
      {
        events: filtered,
        count: filtered.length,
        access: "public",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      },
    );
  } catch (err) {
    console.error("internal/events error", err);
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 },
    );
  }
}
