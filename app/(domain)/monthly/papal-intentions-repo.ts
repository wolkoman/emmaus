import { pb } from "@/util/pocketbase";

export interface PapalIntention {
  title: string;
  text: string;
}

/**
 * Monthly papal prayer intentions ("Gebetsanliegen des Papstes"), maintained
 * manually in the `papal_intentions` PB collection — the Vatican publishes
 * them a year ahead; there is no reliable public API for the German texts.
 */
export async function fetchPapalIntention(
  month: string, // "YYYY-MM"
): Promise<PapalIntention | undefined> {
  const client = await pb();
  try {
    const rec = (await client
      .collection("papal_intentions")
      .getFirstListItem(
        client.filter("month = {:month}", { month }),
      )) as unknown as PapalIntention;
    return { title: rec.title ?? "", text: rec.text ?? "" };
  } catch (err) {
    if (
      !!err &&
      typeof err === "object" &&
      "status" in err &&
      err.status === 404
    )
      return undefined;
    throw err;
  }
}
