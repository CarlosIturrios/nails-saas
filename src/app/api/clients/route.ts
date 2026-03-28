import { NextResponse } from "next/server";

import { canManageOrganization } from "@/src/lib/authorization";
import { createOrganizationClient } from "@/src/lib/capture-clients";
import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";

export async function POST(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      getOrganizationContextFromRequest(),
    ]);

    if (!context.currentOrganizationId) {
      return NextResponse.json(
        { error: "Selecciona una organización antes de continuar" },
        { status: 400 }
      );
    }

    if (
      !canManageOrganization(
        context.user.role,
        context.currentOrganizationRole
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Solo la administración de la organización puede crear clientes manualmente.",
        },
        { status: 403 }
      );
    }

    const client = await createOrganizationClient({
      organizationId: context.currentOrganizationId,
      name: String(body.name ?? ""),
      phone: typeof body.phone === "string" ? body.phone : null,
      email: typeof body.email === "string" ? body.email : null,
    });

    return NextResponse.json({ ok: true, client }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error creando el cliente",
      },
      { status: 400 }
    );
  }
}
