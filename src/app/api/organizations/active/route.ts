import { NextResponse } from "next/server";

import {
  applyOrganizationCookies,
  assertOrganizationMembership,
  getOrganizationContextFromRequest,
} from "@/src/lib/organizations/context";

export async function POST(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      getOrganizationContextFromRequest(),
    ]);

    if (!body.organizationId) {
      return NextResponse.json(
        { error: "La organización es obligatoria" },
        { status: 400 }
      );
    }

    await assertOrganizationMembership(context.user.id, String(body.organizationId));

    const response = NextResponse.json({ ok: true });
    applyOrganizationCookies(response, {
      activeOrganizationId: String(body.organizationId),
      organizationState:
        context.memberships.length > 1
          ? "multi"
          : context.memberships.length === 1
            ? "single"
            : "none",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error actualizando la organización" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  try {
    const context = await getOrganizationContextFromRequest();
    const response = NextResponse.json({ ok: true });

    applyOrganizationCookies(response, {
      activeOrganizationId: null,
      organizationState:
        context.memberships.length > 1
          ? "multi"
          : context.memberships.length === 1
            ? "single"
            : "none",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error limpiando la organización" },
      { status: 400 }
    );
  }
}
