// src/app/api/auth/verify-code/route.ts
import { NextResponse } from "next/server";
import { verifyLoginCode } from "@/src/lib/services/auth.service";
import {
  applyOrganizationCookies,
} from "@/src/lib/organizations/context";
import { AUTH_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/src/lib/auth/session";
import { DETECTED_TIMEZONE_COOKIE, sanitizeTimezone } from "@/src/lib/dates";

export async function POST(req: Request) {
  try {
    const { email, code, detectedTimezone: rawDetectedTimezone } = await req.json();
    const loginResult = await verifyLoginCode(email, code);
    const detectedTimezone = sanitizeTimezone(rawDetectedTimezone);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE_NAME, loginResult.token, {
      httpOnly: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    applyOrganizationCookies(res, {
      activeOrganizationId: loginResult.activeOrganizationId,
      organizationState: loginResult.organizationState,
    });
    if (detectedTimezone) {
      res.cookies.set(DETECTED_TIMEZONE_COOKIE, detectedTimezone, {
        httpOnly: false,
        maxAge: SESSION_MAX_AGE_SECONDS,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verificando código";
    console.error(err);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
