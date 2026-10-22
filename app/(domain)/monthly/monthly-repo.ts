import { pb } from "@/util/pocketbase";

/**
 * Pocketbase data access for Monatsmitteilungen (`monthlies`).
 * `data` is the persisted MonthlyEditorStore blob (see
 * app/monatsblatt/editor/store.ts); this layer treats it as opaque JSON.
 */

export interface MonthlyRecord {
  id: string;
  name: string;
  month: string; // "YYYY-MM"
  data: unknown;
  updated: string;
  /**
   * Publication result: the PDFs of the last "Veröffentlichen" run and when
   * they were generated. All three are empty until an issue is published, and
   * they are written together (never by the editor's save), so the links
   * always match `publishedAt`.
   */
  flyerPdfUrl: string;
  posterPdfUrl: string;
  /** Empty when the published issue has no Einlage. */
  insertPdfUrl: string;
  publishedAt: string;
  /**
   * When the issue was mailed to the newsletter recipients. Empty means "not
   * sent yet" — the send action refuses to run for a non-empty value.
   */
  newsletterSentAt: string;
}

export type MonthlyPublication = Pick<
  MonthlyRecord,
  "flyerPdfUrl" | "posterPdfUrl" | "insertPdfUrl" | "publishedAt"
>;

/** A published issue as the public page needs it (content included). */
export type PublishedMonthly = Pick<MonthlyRecord, "name" | "month" | "data"> &
  MonthlyPublication;

function isNotFound(err: unknown): boolean {
  return (
    !!err && typeof err === "object" && "status" in err && err.status === 404
  );
}

export async function fetchMonthlyByName(
  name: string,
): Promise<MonthlyRecord | undefined> {
  const client = await pb();
  try {
    const rec = await client
      .collection("monthlies")
      .getFirstListItem(client.filter("name = {:name}", { name }));
    return rec as unknown as MonthlyRecord;
  } catch (err) {
    if (isNotFound(err)) return undefined;
    throw err;
  }
}

/** All monthlies WITHOUT the heavy `data` blobs, newest month first. */
export async function fetchMonthlySpans(): Promise<
  Pick<MonthlyRecord, "id" | "name" | "month" | "updated" | "publishedAt">[]
> {
  const client = await pb();
  const rows = await client.collection("monthlies").getFullList({
    sort: "-month",
    fields: "id,name,month,updated,publishedAt",
  });
  return rows as unknown as MonthlyRecord[];
}

/**
 * Store the result of a publication run. Separate columns (not part of the
 * opaque `data` blob) so the editor's next save can't wipe the links.
 */
export async function setMonthlyPublication(
  name: string,
  publication: MonthlyPublication,
): Promise<void> {
  const existing = await fetchMonthlyByName(name);
  if (!existing) throw new Error(`Monthly "${name}" not found`);
  const client = await pb();
  const updated = (await client
    .collection("monthlies")
    .update(existing.id, publication)) as unknown as MonthlyPublication;
  // PB drops unknown fields silently, so a missing migration would look like a
  // successful publication that stored nothing. Verify instead of hoping.
  if (!updated.publishedAt) {
    throw new Error(
      "Pocketbase hat die Publikationsfelder nicht gespeichert — Migration " +
        "1729501300_monthly_publication.js deployen.",
    );
  }
  if (publication.insertPdfUrl && !updated.insertPdfUrl) {
    throw new Error(
      "Pocketbase hat den Einlage-Link nicht gespeichert — Migration " +
        "1729502200_monthly_insert_pdf.js deployen.",
    );
  }
}

/**
 * The issue the public page shows: published, its covered date range includes
 * today, and among those the highest issue month.
 *
 * Both conditions matter. Unpublished drafts have no PDFs to link to. And an
 * issue prepared (and published, to get its PDFs) weeks ahead must not replace
 * the one currently lying in the church — it appears the day its range starts,
 * which is also the day the previous one stops being current.
 *
 * Never throws: this drives a public page, which should fall back to "the next
 * issue is being prepared" rather than error out — including on installations
 * where the publication columns aren't migrated yet.
 */
export async function fetchCurrentPublishedMonthly(): Promise<
  PublishedMonthly | undefined
> {
  try {
    const client = await pb();
    // The date range lives inside the opaque `data` blob, so it can't be part
    // of the PB filter. Newest months first; the answer is the first match,
    // and looking three issues back is plenty for a monthly publication.
    const page = await client.collection("monthlies").getList(1, 3, {
      filter: "publishedAt != ''",
      sort: "-month",
      fields:
        "name,month,data,publishedAt,flyerPdfUrl,posterPdfUrl,insertPdfUrl",
    });
    const today = new Date().toISOString().slice(0, 10);
    return (page.items as unknown as PublishedMonthly[]).find((issue) => {
      const range = (
        issue.data as { dateRange?: { start?: string; end?: string } } | null
      )?.dateRange;
      return (
        !!range?.start &&
        !!range.end &&
        range.start <= today &&
        today <= range.end
      );
    });
  } catch (error) {
    console.warn("Could not load the current monthly", { error });
    return undefined;
  }
}

/**
 * Stamp an issue as mailed. Called BEFORE handing the mail to SMTP, and it
 * verifies the write (PB drops unknown fields silently): without a persisted
 * marker a retry would send the whole list a second time, so a failure here
 * must stop the send.
 */
export async function markMonthlyNewsletterSent(name: string): Promise<string> {
  const existing = await fetchMonthlyByName(name);
  if (!existing) throw new Error(`Monthly "${name}" not found`);
  const client = await pb();
  const newsletterSentAt = new Date().toISOString();
  const updated = (await client
    .collection("monthlies")
    .update(existing.id, { newsletterSentAt })) as unknown as MonthlyRecord;
  if (!updated.newsletterSentAt) {
    throw new Error(
      "Pocketbase hat den Newsletter-Zeitstempel nicht gespeichert — " +
        "Migration 1729501400_monthly_newsletter.js deployen. Es wurde nichts " +
        "versendet.",
    );
  }
  return updated.newsletterSentAt;
}

/** Create or update (by unique name) a monthly. */
export async function upsertMonthlyRecord(monthly: {
  name: string;
  month: string;
  data: unknown;
}): Promise<void> {
  const client = await pb();
  const existing = await fetchMonthlyByName(monthly.name);
  if (existing) {
    await client.collection("monthlies").update(existing.id, monthly);
  } else {
    await client.collection("monthlies").create(monthly);
  }
}
