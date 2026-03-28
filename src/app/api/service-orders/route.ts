import {
  ServiceOrderFlowType,
  ServiceOrderItemType,
  ServiceOrderStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";

import {
  createServiceOrderFromQuote,
  listServiceOrdersForOrganization,
} from "@/src/lib/service-orders";
import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { canPerformOperationalActionForContext } from "@/src/lib/authorization";

function normalizeStatus(value: unknown) {
  if (
    value === ServiceOrderStatus.DRAFT ||
    value === ServiceOrderStatus.CONFIRMED ||
    value === ServiceOrderStatus.IN_PROGRESS ||
    value === ServiceOrderStatus.COMPLETED ||
    value === ServiceOrderStatus.PAID ||
    value === ServiceOrderStatus.CANCELLED
  ) {
    return value;
  }

  return ServiceOrderStatus.CONFIRMED;
}

function normalizeFlowType(value: unknown) {
  return value === ServiceOrderFlowType.SCHEDULED
    ? ServiceOrderFlowType.SCHEDULED
    : ServiceOrderFlowType.WALK_IN;
}

function normalizeItemType(value: unknown) {
  if (
    value === ServiceOrderItemType.SERVICE ||
    value === ServiceOrderItemType.EXTRA ||
    value === ServiceOrderItemType.ADJUSTMENT
  ) {
    return value;
  }

  return ServiceOrderItemType.SERVICE;
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

    const canReadOrders =
      canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "create_order"
      ) ||
      canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "schedule_order"
      ) ||
      canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "progress_order"
      ) ||
      canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "charge_order"
      );

    if (!canReadOrders) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const orders = await listServiceOrdersForOrganization(context.currentOrganizationId);
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error cargando órdenes",
      },
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

    const body = await request.json();
    const requestedStatus = normalizeStatus(body.status);
    const requestedFlowType = normalizeFlowType(body.flowType);

    if (
      !canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "create_order"
      )
    ) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (
      requestedFlowType === ServiceOrderFlowType.SCHEDULED &&
      !canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "schedule_order"
      )
    ) {
      return NextResponse.json(
        { error: "Tu perfil no puede programar órdenes" },
        { status: 403 }
      );
    }

    if (
      requestedStatus === ServiceOrderStatus.PAID &&
      !canPerformOperationalActionForContext(
        context.user.role,
        context.currentOrganizationRole,
        context.currentOrganizationPermissionProfile,
        "charge_order"
      )
    ) {
      return NextResponse.json(
        { error: "Tu perfil no puede cobrar órdenes" },
        { status: 403 }
      );
    }

    const items = Array.isArray(body.items) ? body.items : [];

    const order = await createServiceOrderFromQuote({
      organizationId: context.currentOrganizationId,
      clientId: String(body.clientId ?? "").trim() || null,
      createdByUserId: context.user.id,
      assignedToUserId: String(body.assignedToUserId ?? "").trim() || null,
      status: requestedStatus,
      flowType: requestedFlowType,
      customerName: String(body.customerName ?? "").trim() || null,
      customerPhone: String(body.customerPhone ?? "").trim() || null,
      notes: String(body.notes ?? "").trim() || null,
      scheduledFor: String(body.scheduledFor ?? "").trim() || null,
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

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error creando la orden",
      },
      { status: 400 }
    );
  }
}
