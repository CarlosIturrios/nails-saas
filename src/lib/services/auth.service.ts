// src/lib/services/auth.service.ts

import { prisma } from "@/src/lib/db";
import { randomInt } from "crypto";
import { sendEmailBackend } from "./mail.service";
import { signJwt } from "@/src/lib/auth/jwt";
import { getLoginOrganizationState } from "@/src/lib/organizations/context";

export async function sendLoginCode(email: string) {
  const code = randomInt(100000, 999999).toString();

  await prisma.loginCode.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  try {
    await sendEmailBackend(
      email,
      "Tu código de acceso",
      `Tu código de acceso es: ${code}\n\nExpira en 10 minutos.`
    );
    console.log("Código enviado a:", email);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("Error enviando código:", message);
    throw new Error("No se pudo enviar el código al correo");
  }
}

export async function verifyLoginCode(email: string, code: string) {
  const record = await prisma.loginCode.findFirst({
    where: { email, code },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new Error("Código inválido o expirado");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("Intente de nuevo mas tarde.");
  }

  await prisma.loginCode.delete({
    where: { id: record.id },
  });

  const organizationState = await getLoginOrganizationState(user.id);

  return {
    token: signJwt({
      userId: user.id,
      role: user.role,
    }),
    ...organizationState,
  };
}
