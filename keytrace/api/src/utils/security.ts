import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/index.js";

const SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function signToken(payload: { userId: string; username: string; role: string }): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function sanitizeNoSqlInput<T>(input: T): T {
  if (typeof input !== "object" || input === null) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeNoSqlInput) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    // Strip operators starting with $ (e.g. $gt, $ne, $where)
    if (!key.startsWith("$")) {
      cleanObj[key] = sanitizeNoSqlInput(value);
    }
  }
  return cleanObj as T;
}
