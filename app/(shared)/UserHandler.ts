"use server";
import { cookies } from "next/headers";
import { resolvePerson } from "@/domain/users/UserResolver";
import { CpPerson } from "@/util/cockpit.generated";

export async function resolveUserFromServer(): Promise<CpPerson | undefined> {
  const jar = await cookies();
  const jwt = jar.get("JWT_EMMAUS")?.value;
  if (!jwt) return undefined;
  return await resolvePerson(jwt);
}
