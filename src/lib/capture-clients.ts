import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/src/lib/db";

interface ResolveClientForCaptureInput {
  organizationId: string;
  clientId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
}

interface CreateOrganizationClientInput {
  organizationId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export async function resolveClientForCapture(input: ResolveClientForCaptureInput) {
  const explicitClientId = input.clientId?.trim() || null;
  const customerName = input.customerName?.trim() || null;
  const customerPhone = input.customerPhone?.trim() || null;

  if (explicitClientId) {
    const existingClient = await prisma.client.findFirst({
      where: {
        id: explicitClientId,
        organizationId: input.organizationId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    if (!existingClient) {
      throw new Error("El cliente no pertenece a esta organización");
    }

    const updates: {
      name?: string;
      phone?: string;
    } = {};

    if (customerName && existingClient.name !== customerName) {
      updates.name = customerName;
    }

    if (customerPhone && existingClient.phone !== customerPhone) {
      updates.phone = customerPhone;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.client.update({
        where: {
          id: existingClient.id,
        },
        data: updates,
      });
    }

    return existingClient.id;
  }

  if (!customerName && !customerPhone) {
    return null;
  }

  if (customerPhone) {
    const existingByPhone = await prisma.client.findFirst({
      where: {
        organizationId: input.organizationId,
        phone: customerPhone,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (existingByPhone) {
      if (customerName && existingByPhone.name !== customerName) {
        await prisma.client.update({
          where: {
            id: existingByPhone.id,
          },
          data: {
            name: customerName,
          },
        });
      }

      return existingByPhone.id;
    }
  }

  if (customerName) {
    const existingByName = await prisma.client.findFirst({
      where: {
        organizationId: input.organizationId,
        name: {
          equals: customerName,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingByName) {
      if (customerPhone) {
        await prisma.client.update({
          where: {
            id: existingByName.id,
          },
          data: {
            phone: customerPhone,
          },
        });
      }

      return existingByName.id;
    }
  }

  if (!customerName) {
    return null;
  }

  const createdClient = await prisma.client.create({
    data: {
      organizationId: input.organizationId,
      name: customerName,
      phone: customerPhone || "SIN_TELEFONO",
    },
    select: {
      id: true,
    },
  });

  return createdClient.id;
}

export async function createOrganizationClient(input: CreateOrganizationClientInput) {
  const name = input.name.trim();
  const phone = input.phone?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;

  if (!name) {
    throw new Error("El nombre es obligatorio");
  }

  if (phone) {
    const existingByPhone = await prisma.client.findFirst({
      where: {
        organizationId: input.organizationId,
        phone,
      },
      select: {
        id: true,
      },
    });

    if (existingByPhone) {
      throw new Error("Ya existe un cliente con ese teléfono en esta organización");
    }
  }

  if (email) {
    const existingByEmail = await prisma.client.findFirst({
      where: {
        organizationId: input.organizationId,
        email: {
          equals: email,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingByEmail) {
      throw new Error("Ya existe un cliente con ese correo en esta organización");
    }
  }

  const client = await prisma.client.create({
    data: {
      organizationId: input.organizationId,
      name,
      phone: phone || "SIN_TELEFONO",
      email,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  });

  return {
    id: client.id,
    name: client.name,
    phone: client.phone === "SIN_TELEFONO" ? null : client.phone,
    email: client.email,
  };
}
