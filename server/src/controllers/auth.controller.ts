import type { Request, Response } from "express";
import { hash, verify } from "argon2";
import { prisma } from "../config/database.js";
import { createAccessToken } from "../utils/jwt.js";
import { loginSchema, registerSchema } from "../validators/auth.schema.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  refreshCookieName,
  refreshCookieOptions,
} from "../config/authCookie.js";

import {
  createRefreshSession,
  generateRefreshToken,
  getRefreshTokenExpiration,
  hashRefreshToken,
} from "../utils/refreshToken.js";

export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid registration data",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { name, email, password } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await hash(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    console.error("Registration failed:", error);

    return res.status(500).json({
      message: "Unable to create account",
    });
  }
}

export async function login(req: Request, res: Response) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid login data",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await verify(user.passwordHash, password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const accessToken = await createAccessToken(user.id);

    const refreshToken = await createRefreshSession(user.id);

    res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      message: "Unable to login",
    });
  }
}
export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Failed to load current user:", error);

    return res.status(500).json({
      message: "Unable to load current user",
    });
  }
}
export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies[refreshCookieName] as string | undefined;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh session required",
    });
  }

  const tokenHash = hashRefreshToken(refreshToken);

  try {
    const session = await prisma.refreshSession.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      res.clearCookie(refreshCookieName, refreshCookieOptions);

      return res.status(401).json({
        message: "Invalid or expired refresh session",
      });
    }

    const newRefreshToken = generateRefreshToken();

    const newTokenHash = hashRefreshToken(newRefreshToken);

    const newExpiresAt = getRefreshTokenExpiration();

    await prisma.$transaction([
      prisma.refreshSession.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),

      prisma.refreshSession.create({
        data: {
          userId: session.userId,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    const accessToken = await createAccessToken(session.userId);

    res.cookie(refreshCookieName, newRefreshToken, refreshCookieOptions);

    return res.status(200).json({
      accessToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("Refresh session failed:", error);

    return res.status(500).json({
      message: "Unable to refresh session",
    });
  }
}

export async function logout(
  req: Request,
  res: Response,
) {
  const refreshToken =
    req.cookies[refreshCookieName] as string | undefined;

  if (refreshToken) {
    const tokenHash =
      hashRefreshToken(refreshToken);

    try {
      await prisma.refreshSession.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch (error) {
      console.error(
        "Failed to revoke refresh session:",
        error,
      );
    }
  }

  res.clearCookie(
    refreshCookieName,
    refreshCookieOptions,
  );

  return res.status(200).json({
    message: "Logout successful",
  });
}