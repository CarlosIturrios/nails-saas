import { NextResponse } from "next/server";
import { UserOrganizationRole } from "@prisma/client";

import {
  applyOrganizationCookies,
  getOrganizationContextFromRequest,
  getOrganizationStateFromMemberships,
} from "@/src/lib/organizations/context";
import { prisma } from "@/src/lib/db";
import {
  initializeOrganizationQuoteConfigFromPreset,
} from "@/src/features/quote-calculator-v2/lib/config";
import { normalizeQuoteConfigPreset } from "@/src/features/quote-calculator-v2/lib/presets";

export async function POST(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      getOrganizationContextFromRequest(),
    ]);

    if (context.user.role !== "ADMIN") {
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

    const organization = await prisma.organization.create({
      data: {
        name,
        memberships: {
          create: {
            userId: context.user.id,
            role: UserOrganizationRole.ADMIN,
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
