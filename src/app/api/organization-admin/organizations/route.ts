import { NextResponse } from "next/server";
import { UserOrganizationRole } from "@prisma/client";

import {
  applyOrganizationCookies,
  assertOrganizationAdminAccess,
  getOrganizationContextFromRequest,
  getOrganizationStateFromMemberships,
  requireOrganizationAdminApiContext,
} from "@/src/lib/organizations/context";
import { prisma } from "@/src/lib/db";
import {
  initializeOrganizationQuoteConfigFromPreset,
} from "@/src/features/quote-calculator-v2/lib/config";
import { normalizeQuoteConfigPreset } from "@/src/features/quote-calculator-v2/lib/presets";
import { canCreateOrganizations } from "@/src/lib/authorization";
import { sanitizeTimezone, UTC_TIMEZONE } from "@/src/lib/dates";

export async function POST(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      getOrganizationContextFromRequest(),
    ]);

    if (!canCreateOrganizations(context.user.role)) {
      return NextResponse.json(
        { error: "Solo un administrador global puede crear organizaciones" },
        { status: 403 }
      );
    }

    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const quoteConfigPreset = normalizeQuoteConfigPreset(body.quoteConfigPreset);
    const defaultTimezone =
      sanitizeTimezone(body.defaultTimezone, context.currentTimezone?.timezone ?? UTC_TIMEZONE) ??
      UTC_TIMEZONE;

    const organization = await prisma.organization.create({
      data: {
        name,
        defaultTimezone,
        memberships: {
          create: {
            userId: context.user.id,
            role: UserOrganizationRole.ORG_ADMIN,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    await initializeOrganizationQuoteConfigFromPreset(
      organization.id,
      organization.name,
      quoteConfigPreset
    );

    const response = NextResponse.json({ ok: true, organization }, { status: 201 });
    applyOrganizationCookies(response, {
      activeOrganizationId: organization.id,
      organizationState: getOrganizationStateFromMemberships(
        context.memberships.length + 1
      ),
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error creando la organización",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      requireOrganizationAdminApiContext(),
    ]);

    const organizationId = String(
      body.organizationId ?? context.currentOrganizationId ?? ""
    ).trim();
    const defaultTimezone = sanitizeTimezone(body.defaultTimezone);

    if (!organizationId) {
      return NextResponse.json(
        { error: "Selecciona una organización antes de continuar" },
        { status: 400 }
      );
    }

    if (!defaultTimezone) {
      return NextResponse.json(
        { error: "Selecciona una zona horaria válida" },
        { status: 400 }
      );
    }

    await assertOrganizationAdminAccess(context.user.id, organizationId);

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        defaultTimezone,
      },
      select: {
        id: true,
        name: true,
        defaultTimezone: true,
      },
    });

    return NextResponse.json({
      ok: true,
      organization,
      message: "Zona horaria de la organización actualizada correctamente.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error actualizando la organización",
      },
      { status: 400 }
    );
  }
}
