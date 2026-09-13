import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, SESSION_TTL_MS } from "./config";
import {
  cleanupExpiredSessions,
  createSession,
  createUser,
  deleteSessionByTokenHash,
  findUserByEmail,
  getSessionByTokenHash,
} from "./db";
import type { AuthUser } from "./types";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerUser(input: { email: string; password: string; displayName: string }) {
  const existing = findUserByEmail(input.email.toLowerCase());
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  return createUser(input.email.toLowerCase(), passwordHash, input.displayName.trim());
}

export async function authenticateUser(email: string, password: string) {
  const user = findUserByEmail(email.toLowerCase());
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  } satisfies AuthUser;
}

export async function createUserSession(user: AuthUser) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  createSession(user.id, tokenHash, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    deleteSessionByTokenHash(hashToken(token));
  }

  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  cleanupExpiredSessions(new Date().toISOString());

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = getSessionByTokenHash(hashToken(token));
  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    deleteSessionByTokenHash(hashToken(token));
    return null;
  }

  return {
    id: session.userId,
    email: session.email,
    displayName: session.displayName,
  } satisfies AuthUser;
}
