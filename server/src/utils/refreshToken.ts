import {
  createHash,
  randomBytes,
} from "node:crypto";

import { prisma } from "../config/database.js";

const REFRESH_TOKEN_DAYS = 7;

export function generateRefreshToken() {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export function getRefreshTokenExpiration() {
  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + REFRESH_TOKEN_DAYS,
  );

  return expiresAt;
}

export async function createRefreshSession(
  userId: string,
) {
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshTokenExpiration();

  await prisma.refreshSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return refreshToken;
}