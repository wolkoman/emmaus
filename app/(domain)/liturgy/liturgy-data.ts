import { Unarrify } from "@/util/unarrify";
import { CpLiturgy } from "@/util/cockpit.generated";

export type LiturgyData = CpLiturgy;

export type Liturgy = Unarrify<CpLiturgy[string]> & { date: string };
