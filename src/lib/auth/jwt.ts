// src/lib/auth/jwt.ts

import jwt from "jsonwebtoken";

import { SESSION_MAX_AGE_SECONDS } from "@/src/lib/auth/session";

const SECRET = process.env.JWT_SECRET!;

export function signJwt(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, SECRET);
}
