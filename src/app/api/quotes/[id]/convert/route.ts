import { NextResponse } from "next/server";

import { convertQuoteToServiceOrder } from "@/src/lib/quotes";
import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { canPerformOperationalActionForContext } from "@/src/lib/authorization";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const [{ id }, organizationContext, body] = await Promise.all([
      context.params,
      getOrganizationContextFromRequest(),
      _request.json().catch(() => ({})),
    ]);

    if (!organizationContext.currentOrganizationId) {
      return NextResponse.json(
        { error: "Selecciona una organización antes de continuar" },
        { status: 400 }
      );
    }

    if (
      !canPerformOperationalActionForContext(
        organizationContext.user.role,
        organizationContext.currentOrganizationRole,
        organizationContext.currentOrganizationPermissionProfile,
        "convert_quote"
      )
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const order = await convertQuoteToServiceOrder(
      organizationContext.currentOrganizationId,
      id,
      organizationContext.user.id,
      {
        assignedToUserId:
          typeof body.assignedToUserId === "string" ? body.assignedToUserId : null,
        scheduledFor:
          typeof body.scheduledFor === "string" ? body.scheduledFor : null,
        timeZone: organizationContext.currentTimezone?.timezone ?? null,
      }
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error convirtiendo la propuesta",
      },
      { status: 400 }
    );
  }
}
