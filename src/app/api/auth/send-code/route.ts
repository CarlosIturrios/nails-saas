// src/app/api/auth/send-code/route.ts

import { NextResponse } from "next/server";
import { sendLoginCode } from "@/src/lib/services/auth.service";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) throw new Error("Correo inválido");

    await sendLoginCode(email);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error enviando código";
    console.error(err);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
