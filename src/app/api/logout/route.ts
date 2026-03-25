// src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/src/lib/organizations/context";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);

  return response;
}
