"use server";

import {
  fetchSiteStructure,
  type SiteStructure,
} from "@/app/(domain)/content/content-repo";

// Cockpit-era name kept so consumers (nav, /[slug] pages) didn't change.
export type CpSiteStructure = SiteStructure;

export async function fetchEmmausSites(): Promise<CpSiteStructure[]> {
  return fetchSiteStructure();
}
