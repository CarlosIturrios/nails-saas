import { NextResponse } from "next/server";

import { SESSION_MAX_AGE_SECONDS } from "@/src/lib/auth/session";
import {
  DETECTED_TIMEZONE_COOKIE,
  ResolvedTimezonePreference,
  UTC_TIMEZONE,
  resolveTimezonePreference,
  sanitizeTimezone,
} from "@/src/lib/dates";
import { prisma } from "@/src/lib/db";
import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";

function timezoneCookieOptions() {
  return {
    httpOnly: false,
    maxAge: SESSION_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

function buildResponse(
  resolvedTimezone: ResolvedTimezonePreference,
  detectedTimezone: string | null
) {
  const response = NextResponse.json({
    ok: true,
    timezone: resolvedTimezone.timezone,
    source: resolvedTimezone.source,
    detectedTimezone,
  });

  if (detectedTimezone) {
    response.cookies.set(
      DETECTED_TIMEZONE_COOKIE,
      detectedTimezone,
      timezoneCookieOptions()
    );
  } else {
    response.cookies.set(DETECTED_TIMEZONE_COOKIE, "", {
      ...timezoneCookieOptions(),
      maxAge: 0,
    });
  }

  return response;
}

export async function POST(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      getOrganizationContextFromRequest(),
    ]);
    const detectedTimezone = sanitizeTimezone(body.detectedTimezone);

    if (!detectedTimezone) {
      return NextResponse.json(
        { error: "La zona horaria detectada no es válida" },
        { status: 400 }
      );
    }

    const resolvedTimezone = resolveTimezonePreference({
      userTimezone: context.user.timezone,
      detectedTimezone,
      organizationTimezone:
        context.currentOrganization?.defaultTimezone ?? UTC_TIMEZONE,
    });

    return buildResponse(resolvedTimezone, detectedTimezone);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error actualizando la zona horaria detectada",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      getOrganizationContextFromRequest(),
    ]);
    const nextUserTimezone =
      body.timezone === null ? null : sanitizeTimezone(body.timezone);
    const detectedTimezone = sanitizeTimezone(body.detectedTimezone);

    if (body.timezone !== null && !nextUserTimezone) {
      return NextResponse.json(
        { error: "Selecciona una zona horaria válida" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: context.user.id },
      data: {
        timezone: nextUserTimezone,
      },
      select: {
        timezone: true,
      },
    });

    const resolvedTimezone = resolveTimezonePreference({
      userTimezone: updatedUser.timezone,
      detectedTimezone:
        detectedTimezone ?? context.currentTimezone?.detectedTimezone ?? null,
      organizationTimezone:
        context.currentOrganization?.defaultTimezone ?? UTC_TIMEZONE,
    });

    return buildResponse(
      resolvedTimezone,
      detectedTimezone ?? context.currentTimezone?.detectedTimezone ?? null
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error guardando la zona horaria del usuario",
      },
      { status: 400 }
    );
  }
}
