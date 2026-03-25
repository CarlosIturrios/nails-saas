// src/lib/auth/getUserFromRequest.ts

import { cookies } from "next/headers";
import { verifyJwt } from "@/src/lib/auth/jwt";
import { AUTH_COOKIE_NAME, SessionTokenPayload } from "@/src/lib/auth/session";

export async function getUserFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw new Error("No autenticado");
  }

  const payload = verifyJwt(token) as SessionTokenPayload;

  return payload;
}
