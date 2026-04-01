import {
  QuoteItemType,
  ServiceOrderFlowType,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { canManageOrganization } from "@/src/lib/authorization";
import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { updatePersistentQuote } from "@/src/lib/quotes";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

function normalizeFlowType(value: unknown) {
  return value === ServiceOrderFlowType.SCHEDULED
    ? ServiceOrderFlowType.SCHEDULED
    : ServiceOrderFlowType.WALK_IN;
}

function normalizeItemType(value: unknown) {
  if (
    value === QuoteItemType.SERVICE ||
    value === QuoteItemType.EXTRA ||
    value === QuoteItemType.ADJUSTMENT
  ) {
    return value;
  }

  return QuoteItemType.SERVICE;
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
      !canManageOrganization(
        organizationContext.user.role,
        organizationContext.currentOrganizationRole
      )
    ) {
      return NextResponse.json(
        { error: "Solo un admin puede editar propuestas existentes" },
        { status: 403 }
      );
    }

    const items = Array.isArray(body.items) ? body.items : [];

    const quote = await updatePersistentQuote({
      organizationId: organizationContext.currentOrganizationId,
      quoteId: id,
      clientId: String(body.clientId ?? "").trim() || null,
      flowType: normalizeFlowType(body.flowType),
      customerName: String(body.customerName ?? "").trim() || null,
      customerPhone: String(body.customerPhone ?? "").trim() || null,
      notes: String(body.notes ?? "").trim() || null,
      scheduledFor: String(body.scheduledFor ?? "").trim() || null,
      timeZone: organizationContext.currentTimezone?.timezone ?? null,
      currency: String(body.currency ?? "MXN"),
      snapshot:
        body.snapshot && typeof body.snapshot === "object" && !Array.isArray(body.snapshot)
          ? body.snapshot
          : null,
      items: items.map((item: Record<string, unknown>) => ({
        itemType: normalizeItemType(item.itemType),
        label: String(item.label ?? ""),
        description: String(item.description ?? "").trim() || null,
        quantity: Number(item.quantity ?? 1),
        unitPrice: Number(item.unitPrice ?? 0),
        total: Number(item.total ?? 0),
        metadata:
          item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
            ? (item.metadata as Record<string, unknown>)
            : null,
      })),
    });

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
