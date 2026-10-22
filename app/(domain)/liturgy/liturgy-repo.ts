import {
  CpLiturgy,
  CpLiturgyEvent,
  CpLiturgyRoster,
  CpLiturgyRosterPosition,
  CpPerson,
} from "@/util/cockpit.generated";
import { pbLiturgyRepo } from "@/domain/liturgy/liturgy-repo.pb";

/**
 * Data access for the liturgy slice (liturgy metadata, liturgy events,
 * roster assignments, persons-as-servants). Pocketbase-only — the slice is
 * fully cut over (2026-07-20); the former Cockpit adapter and its
 * `LITURGY_BACKEND` env switch are gone.
 *
 * The adapter keeps the Cockpit-era domain shapes (`Cp*`) and
 * `_id`-compatibility: it exposes the original Cockpit id (stored as
 * `cockpit_id` in PB) whenever one exists, so ids embedded in JWTs, links,
 * and the user store keep working.
 */
export type LiturgyEventSaveData = Partial<
  Omit<CpLiturgyEvent, "cancellations">
> & {
  cancellations?: { value: string }[];
};

export interface LiturgyRepo {
  /** Liturgy metadata (readings, color, rank) keyed by date "YYYY-MM-DD". */
  fetchLiturgy(): Promise<CpLiturgy>;
  /**
   * Upsert liturgy metadata (used by the yearly liturgical-calendar import).
   * Merges into the existing dataset; dates not present in `data` are kept.
   */
  saveLiturgy(data: CpLiturgy): Promise<void>;

  fetchLiturgyEvents(): Promise<CpLiturgyEvent[]>;
  fetchOneLiturgyEvent(filter: {
    _id?: string;
    eventId?: string;
  }): Promise<CpLiturgyEvent | undefined>;
  saveLiturgyEvent(data: LiturgyEventSaveData): Promise<CpLiturgyEvent>;

  fetchLiturgyRosters(): Promise<CpLiturgyRoster[]>;
  fetchOneLiturgyRoster(filter: {
    liturgyEventId: string;
    position: CpLiturgyRosterPosition;
  }): Promise<CpLiturgyRoster | undefined>;
  saveLiturgyRoster(data: Partial<CpLiturgyRoster>): Promise<CpLiturgyRoster>;
  deleteLiturgyRoster(id: string): Promise<void>;

  fetchPersons(): Promise<CpPerson[]>;
  fetchOnePerson(filter: { _id: string }): Promise<CpPerson | undefined>;
  savePersonLiturgyRemindersDisabled(
    personId: string,
    disabled: boolean,
  ): Promise<void>;
}

export function liturgyRepo(): LiturgyRepo {
  return pbLiturgyRepo;
}
