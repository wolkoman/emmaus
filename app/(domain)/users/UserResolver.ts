import { BinaryToTextEncoding, createHash } from "crypto";
import { CpPerson } from "@/util/cockpit.generated";
import { verifyToken } from "@/domain/jsonwebtoken";

export async function resolvePerson(
  jwt: string,
): Promise<CpPerson | undefined> {
  try {
    const user = await verifyToken(jwt);
    // Only session tokens carry code "user"; the same key also signs passkey challenges and old admin tokens.
    if (user?.code !== "user") return undefined;
    return user as unknown as CpPerson;
  } catch (e) {
    return undefined;
  }
}

export function doubleHash(
  password: string,
  hash = "sha256",
  encoding: BinaryToTextEncoding = "base64",
) {
  return createHash(hash)
    .update(createHash(hash).update(password).digest(encoding))
    .digest(encoding);
}
