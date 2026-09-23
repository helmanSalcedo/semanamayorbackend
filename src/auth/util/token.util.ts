import { randomBytes, createHash } from 'node:crypto';

/** High-entropy opaque token for links/refresh tokens (not a user secret). */
export function generateOpaqueToken(): string {
  return randomBytes(48).toString('base64url');
}

/**
 * Deterministic hash for indexed lookup of high-entropy tokens (refresh,
 * email verification, password reset). Unlike passwords, these tokens carry
 * their own entropy, so a fast hash is appropriate — argon2 is reserved for
 * user-chosen secrets.
 */
export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
