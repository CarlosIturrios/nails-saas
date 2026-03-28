import { ServiceOrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { updateServiceOrderStatus } from "@/src/lib/service-orders";
import { canManageOrganization, canPerformOperationalActionForContext } from "@/src/lib/authorization";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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

  throw new Error("Estado de orden no soportado");
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

    const nextStatus = normalizeStatus(body.status);

    if (nextStatus === ServiceOrderStatus.PAID) {
      if (
        !canPerformOperationalActionForContext(
          organizationContext.user.role,
          organizationContext.currentOrganizationRole,
          organizationContext.currentOrganizationPermissionProfile,
          "charge_order"
        )
      ) {
        return NextResponse.json(
          { error: "Tu perfil no puede cobrar órdenes" },
          { status: 403 }
        );
      }
    } else if (nextStatus === ServiceOrderStatus.CANCELLED) {
      if (
        !canManageOrganization(
          organizationContext.user.role,
          organizationContext.currentOrganizationRole
        ) &&
        !canPerformOperationalActionForContext(
          organizationContext.user.role,
          organizationContext.currentOrganizationRole,
          organizationContext.currentOrganizationPermissionProfile,
          "schedule_order"
        )
      ) {
        return NextResponse.json(
          { error: "Tu perfil no puede cancelar órdenes" },
          { status: 403 }
        );
      }
    } else if (
      !canPerformOperationalActionForContext(
        organizationContext.user.role,
        organizationContext.currentOrganizationRole,
        organizationContext.currentOrganizationPermissionProfile,
        "progress_order"
      )
    ) {
      return NextResponse.json(
        { error: "Tu perfil no puede mover órdenes" },
        { status: 403 }
      );
    }

    const order = await updateServiceOrderStatus(
      organizationContext.currentOrganizationId,
      id,
      nextStatus
    );

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error actualizando la orden",
      },
      { status: 400 }
    );
  }
}
