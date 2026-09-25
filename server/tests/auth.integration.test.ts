import request from "supertest";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import { prisma } from "../src/config/database.js";

const testUser = {
  name: "CollabFlow Test User",
  email: "collabflow-auth-test@example.com",
  password: "TestPassword123!",
};

async function clearAuthTestData() {
  await prisma.refreshSession.deleteMany();

  await prisma.user.deleteMany();
}

async function registerTestUser() {
  return request(app).post("/api/auth/register").send(testUser);
}

describe("Authentication API", () => {
  beforeEach(async () => {
    await clearAuthTestData();
  });

  afterAll(async () => {
    await clearAuthTestData();

    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(201);

      expect(response.body.message).toBe("Account created successfully");

      expect(response.body.user).toEqual(
        expect.objectContaining({
          name: testUser.name,
          email: testUser.email,
        }),
      );

      expect(response.body.user.id).toEqual(expect.any(String));

      expect(response.body.user.createdAt).toBeDefined();

      expect(response.body.user.passwordHash).toBeUndefined();

      const storedUser = await prisma.user.findUnique({
        where: {
          email: testUser.email,
        },
      });

      expect(storedUser).not.toBeNull();

      expect(storedUser?.passwordHash).not.toBe(testUser.password);
    });

    it("normalizes the email address to lowercase", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...testUser,
          email: "COLLABFLOW-AUTH-TEST@EXAMPLE.COM",
        })
        .expect(201);

      expect(response.body.user.email).toBe("collabflow-auth-test@example.com");
    });

    it("rejects invalid registration data", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "A",
          email: "not-an-email",
          password: "short",
        })
        .expect(400);

      expect(response.body.message).toBe("Invalid registration data");

      expect(response.body.errors).toBeDefined();
    });

    it("rejects duplicate email addresses", async () => {
      await registerTestUser();

      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser)
        .expect(409);

      expect(response.body).toEqual({
        message: "An account with this email already exists",
      });
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      await registerTestUser();

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.message).toBe("Login successful");

      expect(response.body.accessToken).toEqual(expect.any(String));

      expect(response.body.user).toEqual(
        expect.objectContaining({
          name: testUser.name,
          email: testUser.email,
        }),
      );

      const cookies = response.headers["set-cookie"];

      expect(cookies).toBeDefined();

      const cookieHeader = Array.isArray(cookies)
        ? cookies.join("; ")
        : String(cookies);

      expect(cookieHeader).toContain("collabflow_refresh_token=");

      expect(cookieHeader).toContain("HttpOnly");

      expect(cookieHeader).toContain("Path=/api/auth");

      const sessions = await prisma.refreshSession.findMany();

      expect(sessions).toHaveLength(1);

      expect(sessions[0]?.revokedAt).toBeNull();
    });

    it("rejects an incorrect password", async () => {
      await registerTestUser();

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid email or password",
      });
    });

    it("rejects an unknown email address", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "missing@example.com",
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid email or password",
      });
    });
  });

  describe("GET /api/auth/me", () => {
    it("rejects requests without an access token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("rejects an invalid access token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toEqual({
        message: "Invalid or expired authentication token",
      });
    });

    it("returns the authenticated user", async () => {
      await registerTestUser();

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken as string;

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user).toEqual(
        expect.objectContaining({
          name: testUser.name,
          email: testUser.email,
        }),
      );

      expect(response.body.user.id).toEqual(expect.any(String));
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("rejects refresh without a refresh cookie", async () => {
      const response = await request(app).post("/api/auth/refresh").expect(401);

      expect(response.body).toEqual({
        message: "Refresh session required",
      });
    });

    it("rotates the refresh session and returns a valid access token", async () => {
      await registerTestUser();

      const agent = request.agent(app);

      await agent
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const firstSessions = await prisma.refreshSession.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

      expect(firstSessions).toHaveLength(1);

      expect(firstSessions[0]?.revokedAt).toBeNull();

      const refreshResponse = await agent.post("/api/auth/refresh").expect(200);

      expect(refreshResponse.body.accessToken).toEqual(expect.any(String));

      expect(refreshResponse.body.user).toEqual(
        expect.objectContaining({
          name: testUser.name,
          email: testUser.email,
        }),
      );

      const rotatedSessions = await prisma.refreshSession.findMany({
        orderBy: {
          createdAt: "asc",
        },
      });

      expect(rotatedSessions).toHaveLength(2);

      const revokedSessions = rotatedSessions.filter(
        (session) => session.revokedAt !== null,
      );

      const activeSessions = rotatedSessions.filter(
        (session) => session.revokedAt === null,
      );

      expect(revokedSessions).toHaveLength(1);

      expect(activeSessions).toHaveLength(1);

      expect(activeSessions[0]?.tokenHash).not.toBe(
        revokedSessions[0]?.tokenHash,
      );

      const refreshedAccessToken = refreshResponse.body.accessToken as string;

      const meResponse = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${refreshedAccessToken}`)
        .expect(200);

      expect(meResponse.body.user).toEqual(
        expect.objectContaining({
          name: testUser.name,
          email: testUser.email,
        }),
      );
    });
  });

  describe("POST /api/auth/logout", () => {
    it("revokes the active refresh session", async () => {
      await registerTestUser();

      const agent = request.agent(app);

      await agent
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const activeSessionBeforeLogout = await prisma.refreshSession.findFirst({
        where: {
          revokedAt: null,
        },
      });

      expect(activeSessionBeforeLogout).not.toBeNull();

      const logoutResponse = await agent.post("/api/auth/logout").expect(200);

      expect(logoutResponse.body).toEqual({
        message: "Logout successful",
      });

      const activeSessionsAfterLogout = await prisma.refreshSession.count({
        where: {
          revokedAt: null,
        },
      });

      expect(activeSessionsAfterLogout).toBe(0);
    });

    it("cannot refresh after logout", async () => {
      await registerTestUser();

      const agent = request.agent(app);

      await agent
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      await agent.post("/api/auth/logout").expect(200);

      const response = await agent.post("/api/auth/refresh").expect(401);

      expect(response.body).toEqual({
        message: "Refresh session required",
      });
    });
  });
});
