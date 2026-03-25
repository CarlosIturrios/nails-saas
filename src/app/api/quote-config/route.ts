import { NextResponse } from "next/server";

import {
  getOrganizationQuoteConfigView,
  saveOrganizationQuoteConfig,
} from "@/src/features/quote-calculator-v2/lib/config";
import {
  assertOrganizationAdminAccess,
  getOrganizationContextFromRequest,
} from "@/src/lib/organizations/context";

export async function GET(request: Request) {
  try {
    const context = await getOrganizationContextFromRequest();
    const { searchParams } = new URL(request.url);
    const organizationId = String(searchParams.get("organizationId") ?? "").trim();

    if (!organizationId) {
      return NextResponse.json(
        { error: "La organización es obligatoria" },
        { status: 400 }
      );
    }

    await assertOrganizationAdminAccess(context.user.id, organizationId);
    const config = await getOrganizationQuoteConfigView(organizationId);
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error cargando la configuración",
      },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const context = await getOrganizationContextFromRequest();
    const body = await request.json();
    const organizationId = String(body.organizationId ?? "").trim();

    if (!organizationId) {
      return NextResponse.json(
        { error: "La organización es obligatoria" },
        { status: 400 }
      );
    }

    await assertOrganizationAdminAccess(context.user.id, organizationId);
    await saveOrganizationQuoteConfig(body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error guardando la configuración",
      },
      { status: 400 }
    );
  }
}
