// src/lib/auth/jwt-edge.ts

import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function verifyJwtEdge(token: string) {
  return jwtVerify(token, secret);
}
