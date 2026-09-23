import type { CookieOptions } from "express";

const isProduction =
  process.env.NODE_ENV === "production";

export const refreshCookieName =
  "collabflow_refresh_token";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};