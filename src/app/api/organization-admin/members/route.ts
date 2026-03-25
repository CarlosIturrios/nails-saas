import { NextResponse } from "next/server";
import { UserOrganizationRole, UserRole } from "@prisma/client";

import {
  assertOrganizationMembership,
  requireOrganizationAdminApiContext,
} from "@/src/lib/organizations/context";
import { prisma } from "@/src/lib/db";

export async function POST(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      requireOrganizationAdminApiContext(),
    ]);

    const email = String(body.email ?? "").trim().toLowerCase();
    const organizationId = String(
      body.organizationId ?? context.currentOrganizationId ?? ""
    ).trim();

    if (!organizationId) {
      return NextResponse.json(
        { error: "Selecciona una organización antes de continuar" },
        { status: 400 }
      );
    }

    if (context.user.role !== UserRole.ADMIN) {
      const membership = await assertOrganizationMembership(
        context.user.id,
        organizationId
      );

      if (membership.role !== UserOrganizationRole.ADMIN) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: "Escribe un correo para continuar" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Este correo no existe en la base de usuarios. Por favor contacta a tu administrador para realizar esta acción.",
        },
        { status: 404 }
      );
    }

    const existingMembership = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMembership) {
      return NextResponse.json({
        ok: true,
        status: "existing",
        message: "Ese usuario ya pertenece a esta organización.",
      });
    }

    const membership = await prisma.userOrganization.create({
      data: {
        userId: user.id,
        organizationId,
        role: UserOrganizationRole.MEMBER,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      ok: true,
      status: "created",
      message: "Usuario asignado correctamente a la organización.",
      membership,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error asignando el usuario",
      },
      { status: 400 }
    );
  }
}
