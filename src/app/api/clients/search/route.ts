import { NextResponse } from "next/server";

import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { searchClientsForQuoteAssistant } from "@/src/lib/quotes";
import { canPerformOperationalActionForContext } from "@/src/lib/authorization";

export async function GET(request: Request) {
  try {
    const context = await getOrganizationContextFromRequest();

    if (!context.currentOrganizationId) {
      return NextResponse.json(
        { error: "Selecciona una organización antes de continuar" },
        { status: 400 }
      );
    }

    if (
      !canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "view_clients"
      ) &&
      !canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "create_quote"
      )
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get("q") ?? "").trim();
    const clients = await searchClientsForQuoteAssistant(
      context.currentOrganizationId,
      query
    );

    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error buscando clientes",
      },
      { status: 400 }
    );
  }
}
