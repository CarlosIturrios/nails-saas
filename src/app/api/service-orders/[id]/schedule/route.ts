import { NextResponse } from "next/server";

import { getOrganizationContextFromRequest } from "@/src/lib/organizations/context";
import { updateServiceOrderSchedule } from "@/src/lib/service-orders";
import { canPerformOperationalActionForContext } from "@/src/lib/authorization";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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
        "schedule_order"
      )
    ) {
      return NextResponse.json(
        { error: "Tu perfil no puede programar órdenes" },
        { status: 403 }
      );
    }

    const order = await updateServiceOrderSchedule(
      organizationContext.currentOrganizationId,
      id,
      typeof body.scheduledFor === "string" ? body.scheduledFor : null
    );

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error reprogramando la orden",
      },
      { status: 400 }
    );
  }
}
