// src/app/api/users/create/route.ts

import { NextResponse } from "next/server";
import { UserOrganizationRole } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { requireAdminApiUser } from "@/src/admin/lib/auth";

export async function POST(req: Request) {
  try {
    const currentUser = await requireAdminApiUser();
    const body = await req.json();
    const membershipRole =
      body.role === "ADMIN"
        ? UserOrganizationRole.ADMIN
        : UserOrganizationRole.MEMBER;

    const user = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        countryCode: body.countryCode,
        role: body.role || "EMPLOYEE",
        memberships: currentUser.currentOrganizationId
          ? {
              create: {
                organizationId: currentUser.currentOrganizationId,
                role: membershipRole,
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
