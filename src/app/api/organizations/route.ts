import { NextResponse } from "next/server";
import { UserOrganizationRole } from "@prisma/client";

import {
  applyOrganizationCookies,
  getOrganizationContextFromRequest,
} from "@/src/lib/organizations/context";
import { prisma } from "@/src/lib/db";
import {
  initializeOrganizationQuoteConfigFromPreset,
} from "@/src/features/quote-calculator-v2/lib/config";
import { normalizeQuoteConfigPreset } from "@/src/features/quote-calculator-v2/lib/presets";
import { canCreateOrganizations } from "@/src/lib/authorization";

export async function POST(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      getOrganizationContextFromRequest(),
    ]);

    if (!canCreateOrganizations(context.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const quoteConfigPreset = normalizeQuoteConfigPreset(body.quoteConfigPreset);

    const organization = await prisma.organization.create({
      data: {
        name,
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
      organizationState:
        context.memberships.length === 0 ? "single" : "multi",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creando organización" },
      { status: 400 }
    );
  }
}
