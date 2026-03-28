import {
  QuoteItemType,
  QuoteStatus,
  ServiceOrderFlowType,
} from "@prisma/client";
import { NextResponse } from "next/server";

import {
  createPersistentQuote,
  listQuotesForOrganization,
} from "@/src/lib/quotes";
import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { canPerformOperationalActionForContext } from "@/src/lib/authorization";

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

  return QuoteStatus.DRAFT;
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

export async function GET() {
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
        "create_quote"
      ) &&
      !canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "convert_quote"
      )
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const quotes = await listQuotesForOrganization(context.currentOrganizationId);
    return NextResponse.json(quotes);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error cargando propuestas" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
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
        "create_quote"
      )
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];

    const quote = await createPersistentQuote({
      organizationId: context.currentOrganizationId,
      clientId: String(body.clientId ?? "").trim() || null,
      createdByUserId: context.user.id,
      status: normalizeStatus(body.status),
      flowType: normalizeFlowType(body.flowType),
      customerName: String(body.customerName ?? "").trim() || null,
      customerPhone: String(body.customerPhone ?? "").trim() || null,
      notes: String(body.notes ?? "").trim() || null,
      scheduledFor: String(body.scheduledFor ?? "").trim() || null,
      timeZone: context.currentTimezone?.timezone ?? null,
      currency: String(body.currency ?? "MXN"),
      source: "quote_calculator_v2",
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

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creando la propuesta" },
      { status: 400 }
    );
  }
}
