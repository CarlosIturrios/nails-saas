import { NextResponse } from "next/server";
import {
  UserOrganizationPermissionProfile,
  UserOrganizationRole,
} from "@prisma/client";

import {
  assertOrganizationMembership,
  requireOrganizationAdminApiContext,
} from "@/src/lib/organizations/context";
import { prisma } from "@/src/lib/db";
import {
  canManageOtherOrganizationAdmins,
  canRemoveMembership,
} from "@/src/lib/authorization";

function parseMembershipRole(value: unknown) {
  return value === UserOrganizationRole.ORG_ADMIN
    ? UserOrganizationRole.ORG_ADMIN
    : UserOrganizationRole.EMPLOYEE;
}

function parsePermissionProfile(value: unknown) {
  if (value === UserOrganizationPermissionProfile.FRONT_DESK) {
    return UserOrganizationPermissionProfile.FRONT_DESK;
  }

  if (value === UserOrganizationPermissionProfile.SALES_ONLY) {
    return UserOrganizationPermissionProfile.SALES_ONLY;
  }

  if (value === UserOrganizationPermissionProfile.OPERATOR) {
    return UserOrganizationPermissionProfile.OPERATOR;
  }

  if (value === UserOrganizationPermissionProfile.VIEW_ONLY) {
    return UserOrganizationPermissionProfile.VIEW_ONLY;
  }

  return UserOrganizationPermissionProfile.FULL_SERVICE;
}

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
    const requestedRole = parseMembershipRole(body.role);

    if (!organizationId) {
      return NextResponse.json(
        { error: "Selecciona una organización antes de continuar" },
        { status: 400 }
      );
    }

    if (!canManageOtherOrganizationAdmins(context.user.role)) {
      const membership = await assertOrganizationMembership(
        context.user.id,
        organizationId
      );

      if (membership.role !== UserOrganizationRole.ORG_ADMIN) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    if (!email) {
      return NextResponse.json(
        { error: "Escribe un correo para continuar" },
        { status: 400 }
      );
    }

    if (
      requestedRole === UserOrganizationRole.ORG_ADMIN &&
      !canManageOtherOrganizationAdmins(context.user.role)
    ) {
      return NextResponse.json(
        { error: "Solo un admin SaaS puede asignar a otra persona como admin de organización" },
        { status: 403 }
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
        role: requestedRole,
        permissionProfile:
          requestedRole === UserOrganizationRole.ORG_ADMIN
            ? UserOrganizationPermissionProfile.FULL_SERVICE
            : parsePermissionProfile(body.permissionProfile),
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

export async function PATCH(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      requireOrganizationAdminApiContext(),
    ]);

    const membershipId = String(body.membershipId ?? "").trim();

    if (!membershipId) {
      return NextResponse.json({ error: "Falta la relación a actualizar" }, { status: 400 });
    }

    const membership = await prisma.userOrganization.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        role: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Relación no encontrada" }, { status: 404 });
    }

    await assertOrganizationMembership(context.user.id, membership.organizationId);

    const nextRole = parseMembershipRole(body.role);
    const nextProfile =
      nextRole === UserOrganizationRole.ORG_ADMIN
        ? UserOrganizationPermissionProfile.FULL_SERVICE
        : parsePermissionProfile(body.permissionProfile);

    if (
      membership.role !== UserOrganizationRole.ORG_ADMIN &&
      nextRole === UserOrganizationRole.ORG_ADMIN &&
      !canManageOtherOrganizationAdmins(context.user.role)
    ) {
      return NextResponse.json(
        { error: "Solo un admin SaaS puede promover a otra persona como admin de organización" },
        { status: 403 }
      );
    }

    if (membership.role === UserOrganizationRole.ORG_ADMIN && nextRole !== UserOrganizationRole.ORG_ADMIN) {
      const adminCount = await prisma.userOrganization.count({
        where: {
          organizationId: membership.organizationId,
          role: UserOrganizationRole.ORG_ADMIN,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Debe quedar al menos un admin de organización antes de cambiar este rol" },
          { status: 400 }
        );
      }
    }

    if (
      membership.role === UserOrganizationRole.ORG_ADMIN &&
      nextRole !== UserOrganizationRole.ORG_ADMIN &&
      !canManageOtherOrganizationAdmins(context.user.role) &&
      membership.userId !== context.user.id
    ) {
      return NextResponse.json(
        { error: "No puedes cambiar el rol de otro admin de organización" },
        { status: 403 }
      );
    }

    const updated = await prisma.userOrganization.update({
      where: { id: membership.id },
      data: {
        role: nextRole,
        permissionProfile: nextProfile,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      ok: true,
      membership: updated,
      message: "Permisos actualizados correctamente.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error actualizando permisos" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const [body, context] = await Promise.all([
      request.json(),
      requireOrganizationAdminApiContext(),
    ]);

    const membershipId = String(body.membershipId ?? "").trim();

    if (!membershipId) {
      return NextResponse.json({ error: "Falta la relación a eliminar" }, { status: 400 });
    }

    const membership = await prisma.userOrganization.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        role: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Relación no encontrada" }, { status: 404 });
    }

    await assertOrganizationMembership(context.user.id, membership.organizationId);

    if (
      membership.role === UserOrganizationRole.ORG_ADMIN
    ) {
      const adminCount = await prisma.userOrganization.count({
        where: {
          organizationId: membership.organizationId,
          role: UserOrganizationRole.ORG_ADMIN,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Debe quedar al menos un admin de organización antes de desvincular a esta persona" },
          { status: 400 }
        );
      }
    }

    if (
      !canRemoveMembership({
        actingUserId: context.user.id,
        actingUserRole: context.user.role,
        targetUserId: membership.userId,
        targetMembershipRole: membership.role,
      })
    ) {
      return NextResponse.json(
        { error: "No puedes desvincular a otro admin de organización" },
        { status: 403 }
      );
    }

    await prisma.userOrganization.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({
      ok: true,
      message: "Usuario desvinculado correctamente.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desvinculando usuario" },
      { status: 400 }
    );
  }
}
