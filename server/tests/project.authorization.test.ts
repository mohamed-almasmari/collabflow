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

interface ProjectFixture {
  workspaceId: string;
  projectId: string;
  owner: TestUser;
  admin: TestUser;
  member: TestUser;
  outsider: TestUser;
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
      passwordHash: "not-used-by-project-tests",
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

async function createFixture(): Promise<ProjectFixture> {
  const owner = await createTestUser(
    "Project Owner",
    "project-owner@example.com",
  );

  const admin = await createTestUser(
    "Project Admin",
    "project-admin@example.com",
  );

  const member = await createTestUser(
    "Project Member",
    "project-member@example.com",
  );

  const outsider = await createTestUser(
    "Project Outsider",
    "project-outsider@example.com",
  );

  const workspace = await prisma.workspace.create({
    data: {
      name: "Project Test Workspace",
      ownerId: owner.id,
    },
  });

  await prisma.workspaceMember.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: owner.id,
        role: "OWNER",
      },
      {
        workspaceId: workspace.id,
        userId: admin.id,
        role: "ADMIN",
      },
      {
        workspaceId: workspace.id,
        userId: member.id,
        role: "MEMBER",
      },
    ],
  });

  const project = await prisma.project.create({
    data: {
      name: "Existing Project",
      description: "Project authorization fixture",
      workspaceId: workspace.id,
      createdById: owner.id,
    },
  });

  return {
    workspaceId: workspace.id,
    projectId: project.id,
    owner,
    admin,
    member,
    outsider,
  };
}

describe("Project authorization", () => {
  beforeEach(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    await clearTestData();

    await prisma.$disconnect();
  });

  describe("authentication protection", () => {
    it("rejects project listing without authentication", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(`/api/workspaces/${fixture.workspaceId}/projects`)
        .expect(401);

      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("rejects project creation without authentication", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(`/api/workspaces/${fixture.workspaceId}/projects`)
        .send({
          name: "Unauthorized Project",
        })
        .expect(401);

      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });
  });

  describe("project creation", () => {
    it("allows the workspace owner to create a project", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(`/api/workspaces/${fixture.workspaceId}/projects`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          name: "Owner Project",
          description: "Created by owner",
        })
        .expect(201);

      expect(response.body.message).toBe("Project created successfully");

      expect(response.body.project).toEqual(
        expect.objectContaining({
          name: "Owner Project",
          workspaceId: fixture.workspaceId,
          createdById: fixture.owner.id,
        }),
      );
    });

    it("allows a workspace admin to create a project", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(`/api/workspaces/${fixture.workspaceId}/projects`)
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .send({
          name: "Admin Project",
        })
        .expect(201);

      expect(response.body.project.createdById).toBe(fixture.admin.id);
    });

    it("blocks a regular member from creating projects", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(`/api/workspaces/${fixture.workspaceId}/projects`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          name: "Forbidden Project",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have permission to create projects",
      });
    });

    it("blocks an outsider from creating projects", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(`/api/workspaces/${fixture.workspaceId}/projects`)
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .send({
          name: "Outsider Project",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have access to this workspace",
      });
    });
  });

  describe("project visibility", () => {
    it("allows a regular workspace member to list projects", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(`/api/workspaces/${fixture.workspaceId}/projects`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(200);

      expect(response.body.projects).toHaveLength(1);

      expect(response.body.projects[0].id).toBe(fixture.projectId);
    });

    it("allows a regular workspace member to load a project", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(200);

      expect(response.body.project.id).toBe(fixture.projectId);

      expect(response.body.currentUserRole).toBe("MEMBER");
    });

    it("blocks an outsider from listing workspace projects", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(`/api/workspaces/${fixture.workspaceId}/projects`)
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have access to this workspace",
      });
    });

    it("blocks an outsider from loading a project", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have access to this workspace",
      });
    });
  });

  describe("project updates", () => {
    it("allows the workspace owner to update a project", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          name: "Owner Updated Project",
        })
        .expect(200);

      expect(response.body.message).toBe("Project updated successfully");

      expect(response.body.project.name).toBe("Owner Updated Project");
    });

    it("allows a workspace admin to update a project", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.admin.token}`)
        .send({
          description: "Updated by project admin",
        })
        .expect(200);

      expect(response.body.project.description).toBe(
        "Updated by project admin",
      );
    });

    it("blocks a regular member from updating a project", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          name: "Forbidden Update",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "You do not have permission to update projects",
      });
    });

    it("allows the owner to archive a project", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          status: "ARCHIVED",
        })
        .expect(200);

      expect(response.body.project.status).toBe("ARCHIVED");

      const project = await prisma.project.findUnique({
        where: {
          id: fixture.projectId,
        },
      });

      expect(project?.status).toBe("ARCHIVED");
    });
  });

  describe("cross-workspace isolation", () => {
    it("does not expose a project through another workspace URL", async () => {
      const fixture = await createFixture();

      const secondWorkspace = await prisma.workspace.create({
        data: {
          name: "Second Workspace",
          ownerId: fixture.owner.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          workspaceId: secondWorkspace.id,
          userId: fixture.owner.id,
          role: "OWNER",
        },
      });

      const response = await request(app)
        .get(
          `/api/workspaces/${secondWorkspace.id}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: "Project not found",
      });
    });

    it("does not update a project through another workspace URL", async () => {
      const fixture = await createFixture();

      const secondWorkspace = await prisma.workspace.create({
        data: {
          name: "Update Isolation Workspace",
          ownerId: fixture.owner.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          workspaceId: secondWorkspace.id,
          userId: fixture.owner.id,
          role: "OWNER",
        },
      });

      const response = await request(app)
        .patch(
          `/api/workspaces/${secondWorkspace.id}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          name: "Cross Workspace Update",
        })
        .expect(404);

      expect(response.body).toEqual({
        message: "Project not found",
      });

      const originalProject = await prisma.project.findUnique({
        where: {
          id: fixture.projectId,
        },
      });

      expect(originalProject?.name).toBe("Existing Project");
    });
  });

  describe("project validation", () => {
    it("rejects invalid project creation data", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(`/api/workspaces/${fixture.workspaceId}/projects`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          name: "A",
        })
        .expect(400);

      expect(response.body.message).toBe("Invalid project data");
    });

    it("rejects an empty project update", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.projectId}`,
        )
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe("Invalid project data");
    });
  });
});
