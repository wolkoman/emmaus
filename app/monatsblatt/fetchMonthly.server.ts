"use server";

import {
  fetchCurrentPublishedMonthly,
  fetchMonthlyByName,
  MonthlyRecord,
  PublishedMonthly,
} from "@/app/(domain)/monthly/monthly-repo";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";

/**
 * Cached monthly lookup for the print route.
 *
 * With `cacheComponents`, uncached IO inside a page render gets aborted
 * during Next's prospective prerender pass (surfacing as PB SDK
 * "autocancelled" errors). Caching + tag-based invalidation is the repo's
 * pattern for PB reads on rendered pages; `upsertMonthly` revalidates the
 * "monthly" tag on every save, so the print route is always fresh when the
 * PDF job fetches it.
 */
export async function fetchMonthlyForPrint(
  name: string,
): Promise<MonthlyRecord | undefined> {
  "use cache";
  cacheTag("monthly");
  return await fetchMonthlyByName(name);
}

/**
 * Current issue for the public /monatsblatt page. Same cache tag, so
 * publishing an issue makes it appear immediately — plus a short lifetime,
 * because which issue is current also changes with the DATE, and no
 * revalidation fires for that.
 */
export async function fetchPublishedMonthly(): Promise<
  PublishedMonthly | undefined
> {
  "use cache";
  cacheTag("monthly");
  cacheLife("hours");
  return await fetchCurrentPublishedMonthly();
}
