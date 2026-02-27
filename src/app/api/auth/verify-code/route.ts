// src/app/api/auth/verify-code/route.ts
import { NextResponse } from "next/server";
import { verifyLoginCode } from "@/src/lib/services/auth.service";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const token = await verifyLoginCode(email, code);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Error verificando código" },
      { status: 400 }
    );
  }
}