import { NextResponse } from "next/server";
import { QuoteStatus } from "@prisma/client";

import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { updateQuoteStatus } from "@/src/lib/quotes";
import { canPerformOperationalActionForContext } from "@/src/lib/authorization";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function normalizeStatus(value: unknown) {
  if (
    value === QuoteStatus.DRAFT ||
    value === QuoteStatus.SENT ||
    value === QuoteStatus.ACCEPTED ||
    value === QuoteStatus.CONVERTED ||
    value === QuoteStatus.CANCELLED ||
    value === QuoteStatus.EXPIRED
  ) {
    return value;
  }

  throw new Error("Estado de propuesta no soportado");
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const [{ id }, organizationContext, body] = await Promise.all([
      context.params,
      getOrganizationContextFromRequest(),
      request.json(),
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
        "create_quote"
      )
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const quote = await updateQuoteStatus(
      organizationContext.currentOrganizationId,
      id,
      normalizeStatus(body.status)
    );

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error actualizando la propuesta",
      },
      { status: 400 }
    );
  }
}
