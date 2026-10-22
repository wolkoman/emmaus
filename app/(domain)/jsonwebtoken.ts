import { importPKCS8, importSPKI, JWTPayload, jwtVerify, SignJWT } from "jose";

export async function signToken(payload: object, expiration = "30d") {
  const privateKeyPem = Buffer.from(
    process.env.EMMAUS_PRIVATE_KEY!,
    "base64",
  ).toString("utf8");
  const privateKey = await importPKCS8(privateKeyPem, "RS256");
  return await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(privateKey);
}

export async function verifyToken(token: string) {
  const publicKeyPem = Buffer.from(
    process.env.NEXT_PUBLIC_EMMAUS_PUBLIC_KEY!,
    "base64",
  ).toString("utf8");
  const publicKey = await importSPKI(publicKeyPem, "RS256");
  const { payload } = await jwtVerify(token, publicKey);
  return payload;
}
