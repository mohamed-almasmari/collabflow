import request from "supertest";

import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/app.js";
import { prisma } from "../src/config/database.js";
import { createAccessToken } from "../src/utils/jwt.js";

interface TestUser {
  id: string;
  name: string;
  email: string;
  token: string;
}

interface WorkspaceFixture {
  id: string;
  owner: TestUser;
  admin: TestUser;
  member: TestUser;
  outsider: TestUser;
  adminMembershipId: string;
  memberMembershipId: string;
}

async function clearTestData() {
  await prisma.refreshSession.deleteMany();

  await prisma.workspace.deleteMany();

  await prisma.user.deleteMany();
}

async function createTestUser(name: string, email: string): Promise<TestUser> {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: "not-used-by-workspace-tests",
    },
  });

  const token = await createAccessToken(user.id);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    token,
  };
}

async function createFixture(): Promise<WorkspaceFixture> {
  const owner = await createTestUser(
    "Workspace Owner",
    "workspace-owner@example.com",
  );

  const admin = await createTestUser(
    "Workspace Admin",
    "workspace-admin@example.com",
  );

  const member = await createTestUser(
    "Workspace Member",
    "workspace-member@example.com",
  );

  const outsider = await createTestUser(
    "Workspace Outsider",
    "workspace-outsider@example.com",
  );

  const workspace = await prisma.workspace.create({
    data: {
      name: "Authorization Workspace",
      description: "Workspace used for authorization integration tests",
      ownerId: owner.id,
    },
  });

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  const adminMembership = await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: admin.id,
      role: "ADMIN",
    },
  });

  const memberMembership = await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: member.id,
      role: "MEMBER",
    },
  });

  return {
    id: workspace.id,
    owner,
    admin,
    member,
    outsider,
    adminMembershipId: adminMembership.id,
    memberMembershipId: memberMembership.id,
  };
}

describe("Workspace authorization", () => {
  beforeEach(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    await clearTestData();

    await prisma.$disconnect();
  });

  describe("authentication protection", () => {
    it("rejects workspace listing without authentication", async () => {
      const response = await request(app).get("/api/workspaces").expect(401);

      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("rejects workspace creation without authentication", async () => {
      const response = await request(app)
        .post("/api/workspaces")
        .send({
          name: "Unauthorized Workspace",
        })
        .expect(401);

      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });
  });

  describe("workspace creation", () => {
    it("creates the authenticated user as the workspace owner", async () => {
      const owner = await createTestUser("New Owner", "new-owner@example.com");

      const response = await request(app)
        .post("/api/workspaces")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({
          name: "Created Workspace",
          description: "Created through the API",
        })
        .expect(201);

      expect(response.body.message).toBe("Workspace created successfully");

      expect(response.body.workspace).toEqual(
        expect.objectContaining({
          name: "Created Workspace",
          ownerId: owner.id,
        }),
      );

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: response.body.workspace.id,
            userId: owner.id,
          },
        },
      });

      expect(membership).not.toBeNull();

      expect(membership?.role).toBe("OWNER");
    });
  });

  describe("workspace visibility", () => {
    it("allows members to access their workspace", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(`/api/workspaces/${fixture.id}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(200);

      expect(response.body.workspace.id).toBe(fixture.id);

      expect(response.body.workspace.currentUserRole).toBe("MEMBER");
    });

    it("blocks users who are not workspace members", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(`/api/workspaces/${fixture.id}`)
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have access to this workspace",
      });
    });

    it("only lists workspaces the user belongs to", async () => {
      const fixture = await createFixture();

      const privateWorkspace = await prisma.workspace.create({
        data: {
          name: "Private Workspace",
          ownerId: fixture.outsider.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          workspaceId: privateWorkspace.id,
          userId: fixture.outsider.id,
          role: "OWNER",
        },
      });

      const response = await request(app)
        .get("/api/workspaces")
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(200);

      expect(response.body.workspaces).toHaveLength(1);

      expect(response.body.workspaces[0].id).toBe(fixture.id);
    });
  });

  describe("workspace updates", () => {
    it("allows the owner to update the workspace", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(`/api/workspaces/${fixture.id}`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          name: "Owner Updated Workspace",
        })
        .expect(200);

      expect(response.body.workspace.name).toBe("Owner Updated Workspace");
    });

    it("allows an admin to update the workspace", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(`/api/workspaces/${fixture.id}`)
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .send({
          description: "Updated by an admin",
        })
        .expect(200);

      expect(response.body.workspace.description).toBe("Updated by an admin");
    });

    it("blocks a regular member from updating the workspace", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(`/api/workspaces/${fixture.id}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          name: "Forbidden Update",
        })
        .expect(403);

      expect(response.body.message).toContain("permission");
    });

    it("blocks an outsider from updating the workspace", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(`/api/workspaces/${fixture.id}`)
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .send({
          name: "Forbidden Update",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have access to this workspace",
      });
    });
  });

  describe("adding workspace members", () => {
    it("allows an owner to add a member", async () => {
      const fixture = await createFixture();

      const newUser = await createTestUser(
        "New Workspace Member",
        "new-workspace-member@example.com",
      );

      const response = await request(app)
        .post(`/api/workspaces/${fixture.id}/members`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          email: newUser.email,
          role: "MEMBER",
        })
        .expect(201);

      expect(response.body.member.role).toBe("MEMBER");

      expect(response.body.member.user.email).toBe(newUser.email);
    });

    it("allows an admin to add a member", async () => {
      const fixture = await createFixture();

      const newUser = await createTestUser(
        "Admin Added User",
        "admin-added-user@example.com",
      );

      const response = await request(app)
        .post(`/api/workspaces/${fixture.id}/members`)
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .send({
          email: newUser.email,
          role: "MEMBER",
        })
        .expect(201);

      expect(response.body.member.user.id).toBe(newUser.id);
    });

    it("blocks a regular member from adding members", async () => {
      const fixture = await createFixture();

      const newUser = await createTestUser(
        "Blocked Add User",
        "blocked-add-user@example.com",
      );

      const response = await request(app)
        .post(`/api/workspaces/${fixture.id}/members`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          email: newUser.email,
          role: "MEMBER",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have permission to add workspace members",
      });
    });

    it("prevents adding the same user twice", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(`/api/workspaces/${fixture.id}/members`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          email: fixture.member.email,
          role: "MEMBER",
        })
        .expect(409);

      expect(response.body).toEqual({
        message: "User is already a member of this workspace",
      });
    });
  });

  describe("changing member roles", () => {
    it("allows the owner to promote a member to admin", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.id}/members/${fixture.memberMembershipId}`,
        )
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          role: "ADMIN",
        })
        .expect(200);

      expect(response.body.member.role).toBe("ADMIN");
    });

    it("allows an admin to change a regular member role", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.id}/members/${fixture.memberMembershipId}`,
        )
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .send({
          role: "ADMIN",
        })
        .expect(200);

      expect(response.body.member.role).toBe("ADMIN");
    });

    it("prevents an admin from changing another admin role", async () => {
      const fixture = await createFixture();

      const secondAdmin = await createTestUser(
        "Second Admin",
        "second-admin@example.com",
      );

      const secondAdminMembership = await prisma.workspaceMember.create({
        data: {
          workspaceId: fixture.id,
          userId: secondAdmin.id,
          role: "ADMIN",
        },
      });

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.id}/members/${secondAdminMembership.id}`,
        )
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .send({
          role: "MEMBER",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "Admins cannot change another admin's role",
      });
    });

    it("prevents an admin from changing their own role", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.id}/members/${fixture.adminMembershipId}`,
        )
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .send({
          role: "MEMBER",
        })
        .expect(400);

      expect(response.body).toEqual({
        message: "You cannot change your own workspace role",
      });
    });

    it("prevents changing the workspace owner role", async () => {
      const fixture = await createFixture();

      const ownerMembership = await prisma.workspaceMember.findUniqueOrThrow({
        where: {
          workspaceId_userId: {
            workspaceId: fixture.id,
            userId: fixture.owner.id,
          },
        },
      });

      const response = await request(app)
        .patch(`/api/workspaces/${fixture.id}/members/${ownerMembership.id}`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          role: "ADMIN",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "The workspace owner role cannot be changed",
      });
    });
  });

  describe("removing workspace members", () => {
    it("allows the owner to remove a member", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .delete(
          `/api/workspaces/${fixture.id}/members/${fixture.memberMembershipId}`,
        )
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Workspace member removed successfully",
      });

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          id: fixture.memberMembershipId,
        },
      });

      expect(membership).toBeNull();
    });

    it("allows an admin to remove a regular member", async () => {
      const fixture = await createFixture();

      await request(app)
        .delete(
          `/api/workspaces/${fixture.id}/members/${fixture.memberMembershipId}`,
        )
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .expect(200);

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          id: fixture.memberMembershipId,
        },
      });

      expect(membership).toBeNull();
    });

    it("prevents an admin from removing another admin", async () => {
      const fixture = await createFixture();

      const secondAdmin = await createTestUser(
        "Removal Admin",
        "removal-admin@example.com",
      );

      const secondAdminMembership = await prisma.workspaceMember.create({
        data: {
          workspaceId: fixture.id,
          userId: secondAdmin.id,
          role: "ADMIN",
        },
      });

      const response = await request(app)
        .delete(
          `/api/workspaces/${fixture.id}/members/${secondAdminMembership.id}`,
        )
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .expect(403);

      expect(response.body).toEqual({
        message: "Admins cannot remove another admin",
      });
    });

    it("prevents the owner from being removed", async () => {
      const fixture = await createFixture();

      const ownerMembership = await prisma.workspaceMember.findUniqueOrThrow({
        where: {
          workspaceId_userId: {
            workspaceId: fixture.id,
            userId: fixture.owner.id,
          },
        },
      });

      const response = await request(app)
        .delete(`/api/workspaces/${fixture.id}/members/${ownerMembership.id}`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .expect(403);

      expect(response.body).toEqual({
        message: "The workspace owner cannot be removed",
      });
    });

    it("blocks regular members from removing members", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .delete(
          `/api/workspaces/${fixture.id}/members/${fixture.adminMembershipId}`,
        )
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have permission to remove workspace members",
      });
    });
  });

  describe("cross-workspace isolation", () => {
    it("does not allow a member ID from another workspace to be modified", async () => {
      const fixture = await createFixture();

      const secondWorkspace = await prisma.workspace.create({
        data: {
          name: "Second Workspace",
          ownerId: fixture.outsider.id,
        },
      });

      const outsiderMembership = await prisma.workspaceMember.create({
        data: {
          workspaceId: secondWorkspace.id,
          userId: fixture.outsider.id,
          role: "OWNER",
        },
      });

      const response = await request(app)
        .patch(`/api/workspaces/${fixture.id}/members/${outsiderMembership.id}`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          role: "ADMIN",
        })
        .expect(404);

      expect(response.body).toEqual({
        message: "Workspace member not found",
      });
    });

    it("does not allow a member ID from another workspace to be removed", async () => {
      const fixture = await createFixture();

      const secondWorkspace = await prisma.workspace.create({
        data: {
          name: "Separate Workspace",
          ownerId: fixture.outsider.id,
        },
      });

      const outsiderMembership = await prisma.workspaceMember.create({
        data: {
          workspaceId: secondWorkspace.id,
          userId: fixture.outsider.id,
          role: "OWNER",
        },
      });

      const response = await request(app)
        .delete(
          `/api/workspaces/${fixture.id}/members/${outsiderMembership.id}`,
        )
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: "Workspace member not found",
      });
    });
  });
});
