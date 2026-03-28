// src/app/api/users/create/route.ts

import { NextResponse } from "next/server";
import {
  UserOrganizationPermissionProfile,
  UserOrganizationRole,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { requireAdminApiUser } from "@/src/admin/lib/auth";

export async function POST(req: Request) {
  try {
    const currentUser = await requireAdminApiUser();
    const body = await req.json();
    const membershipRole =
      body.membershipRole === UserOrganizationRole.ORG_ADMIN
        ? UserOrganizationRole.ORG_ADMIN
        : UserOrganizationRole.EMPLOYEE;
    const permissionProfile =
      body.permissionProfile === UserOrganizationPermissionProfile.FRONT_DESK
        ? UserOrganizationPermissionProfile.FRONT_DESK
        : body.permissionProfile === UserOrganizationPermissionProfile.SALES_ONLY
          ? UserOrganizationPermissionProfile.SALES_ONLY
          : body.permissionProfile === UserOrganizationPermissionProfile.OPERATOR
            ? UserOrganizationPermissionProfile.OPERATOR
            : body.permissionProfile === UserOrganizationPermissionProfile.VIEW_ONLY
              ? UserOrganizationPermissionProfile.VIEW_ONLY
              : UserOrganizationPermissionProfile.FULL_SERVICE;

    const user = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        countryCode: body.countryCode,
        role:
          body.role === UserRole.SUPER_ADMIN
            ? UserRole.SUPER_ADMIN
            : body.role === UserRole.SAAS_ADMIN
              ? UserRole.SAAS_ADMIN
              : UserRole.STANDARD_USER,
        memberships: currentUser.currentOrganizationId
          ? {
              create: {
                organizationId: currentUser.currentOrganizationId,
                role: membershipRole,
                permissionProfile,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creando usuario";
    console.error(err);

    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
