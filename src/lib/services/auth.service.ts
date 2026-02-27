// src/lib/services/auth.service.ts

import { prisma } from "@/src/lib/db";
import { randomInt } from "crypto";
import { sendEmailBackend } from "./mail.service";
import { signJwt } from "@/src/lib/auth/jwt";

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
  } catch (err: any) {
    console.error("Error enviando código:", err.message);
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

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("Usuario no existe");

  return signJwt({ userId: user.id, role: user.role });
}
