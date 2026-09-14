import crypto from "crypto";
import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "campusdesk_session";
const SESSION_EXPIRY_DAYS = 7;
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "campusdesk-local-secret-key-salt-production-default";

/**
 * Hash a plain text password using scrypt with a unique random salt.
 * Returns format: "salt:hash"
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a plain text password against a stored "salt:hash" string.
 */
export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string" || !storedHash.includes(":")) {
    return false;
  }
  try {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return keyBuffer.length === derivedKey.length && crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Create a tamper-proof signed session token containing user payload.
 */
export function createSessionToken(payload) {
  const exp = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const tokenPayload = { ...payload, exp };
  const encodedData = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(encodedData)
    .digest("base64url");
  return `${encodedData}.${signature}`;
}

/**
 * Verify a session token and return its payload if valid and unexpired.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }
  try {
    const [encodedData, signature] = token.split(".");
    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(encodedData)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedData, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get current session from request cookies (Server Components & Route Handlers).
 */
export async function getAuthSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/**
 * Set the authentication cookie in Route Handlers.
 */
export async function setAuthCookie(token) {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

/**
 * Clear the authentication cookie in Route Handlers.
 */
export async function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
