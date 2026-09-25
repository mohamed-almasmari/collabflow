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

interface IssueFixture {
  workspaceId: string;
  projectId: string;
  secondProjectId: string;
  issueId: string;
  owner: TestUser;
  admin: TestUser;
  member: TestUser;
  outsider: TestUser;
}

async function waitForActivityLogging() {
  await new Promise((resolve) => {
    setTimeout(resolve, 20);
  });
}

async function clearTestData() {
  /*
   * Issue activity is written asynchronously after
   * the response finishes, so give it a moment before
   * clearing the database between tests.
   */
  await waitForActivityLogging();

  await prisma.activityLog.deleteMany();

  await prisma.notification.deleteMany();

  await prisma.refreshSession.deleteMany();

  await prisma.workspace.deleteMany();

  await prisma.user.deleteMany();
}

async function createTestUser(name: string, email: string): Promise<TestUser> {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: "not-used-by-issue-tests",
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

async function createFixture(): Promise<IssueFixture> {
  const owner = await createTestUser("Issue Owner", "issue-owner@example.com");

  const admin = await createTestUser("Issue Admin", "issue-admin@example.com");

  const member = await createTestUser(
    "Issue Member",
    "issue-member@example.com",
  );

  const outsider = await createTestUser(
    "Issue Outsider",
    "issue-outsider@example.com",
  );

  const workspace = await prisma.workspace.create({
    data: {
      name: "Issue Test Workspace",
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
      name: "Issue Test Project",
      workspaceId: workspace.id,
      createdById: owner.id,
    },
  });

  const secondProject = await prisma.project.create({
    data: {
      name: "Second Issue Project",
      workspaceId: workspace.id,
      createdById: owner.id,
    },
  });

  const issue = await prisma.issue.create({
    data: {
      title: "Existing Issue",
      description: "Issue used by authorization tests",
      status: "TODO",
      priority: "MEDIUM",
      position: 0,
      projectId: project.id,
      createdById: owner.id,
      assigneeId: member.id,
    },
  });

  return {
    workspaceId: workspace.id,
    projectId: project.id,
    secondProjectId: secondProject.id,
    issueId: issue.id,
    owner,
    admin,
    member,
    outsider,
  };
}

function issueBaseUrl(fixture: IssueFixture) {
  return `/api/workspaces/${fixture.workspaceId}/projects/${fixture.projectId}/issues`;
}

describe("Issue authorization and concurrency", () => {
  beforeEach(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    await clearTestData();

    await prisma.$disconnect();
  });

  describe("authentication and visibility", () => {
    it("rejects issue listing without authentication", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(issueBaseUrl(fixture))
        .expect(401);

      expect(response.body).toEqual({
        message: "Authentication required",
      });
    });

    it("allows a workspace member to list project issues", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(issueBaseUrl(fixture))
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(200);

      expect(response.body.issues).toHaveLength(1);

      expect(response.body.issues[0].id).toBe(fixture.issueId);
    });

    it("allows a workspace member to load an issue", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(200);

      expect(response.body.issue.id).toBe(fixture.issueId);

      expect(response.body.issue.title).toBe("Existing Issue");
    });

    it("blocks an outsider from listing project issues", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(issueBaseUrl(fixture))
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: "Project not found or access denied",
      });
    });

    it("does not expose an issue through another project URL", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .get(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.secondProjectId}/issues/${fixture.issueId}`,
        )
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: "Issue not found",
      });
    });
  });

  describe("issue creation", () => {
    it("allows a regular workspace member to create an issue", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(issueBaseUrl(fixture))
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          title: "Member Created Issue",
          description: "Created by a regular member",
          priority: "HIGH",
        })
        .expect(201);

      expect(response.body.message).toBe("Issue created successfully");

      expect(response.body.issue).toEqual(
        expect.objectContaining({
          title: "Member Created Issue",
          priority: "HIGH",
          projectId: fixture.projectId,
          createdById: fixture.member.id,
        }),
      );
    });

    it("blocks an outsider from creating an issue", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(issueBaseUrl(fixture))
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .send({
          title: "Forbidden Issue",
        })
        .expect(404);

      expect(response.body).toEqual({
        message: "Project not found or access denied",
      });
    });

    it("rejects an assignee who is not a workspace member", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(issueBaseUrl(fixture))
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          title: "Invalid Assignee Issue",
          assigneeId: fixture.outsider.id,
        })
        .expect(400);

      expect(response.body).toEqual({
        message: "Assignee must be a member of this workspace",
      });
    });

    it("allows assigning an issue to another workspace member", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .post(issueBaseUrl(fixture))
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .send({
          title: "Assigned Issue",
          assigneeId: fixture.admin.id,
        })
        .expect(201);

      expect(response.body.issue.assigneeId).toBe(fixture.admin.id);
    });

    it("blocks issue creation in an archived project", async () => {
      const fixture = await createFixture();

      await prisma.project.update({
        where: {
          id: fixture.projectId,
        },
        data: {
          status: "ARCHIVED",
        },
      });

      const response = await request(app)
        .post(issueBaseUrl(fixture))
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          title: "Archived Project Issue",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "Archived projects cannot be modified",
      });
    });
  });

  describe("issue updates and optimistic concurrency", () => {
    it("requires the current issue version before updating", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          title: "Missing Version Update",
        })
        .expect(428);

      expect(response.body).toEqual({
        message: "Issue version is required before updating",
      });
    });

    it("rejects an invalid issue version", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .set("If-Unmodified-Since", "not-a-valid-date")
        .send({
          title: "Invalid Version Update",
        })
        .expect(400);

      expect(response.body).toEqual({
        message: "Invalid issue version",
      });
    });

    it("allows a member to update an issue using its current version", async () => {
      const fixture = await createFixture();

      const issue = await prisma.issue.findUniqueOrThrow({
        where: {
          id: fixture.issueId,
        },
      });

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .set("If-Unmodified-Since", issue.updatedAt.toISOString())
        .send({
          title: "Member Updated Issue",
          priority: "HIGH",
        })
        .expect(200);

      expect(response.body.message).toBe("Issue updated successfully");

      expect(response.body.issue.title).toBe("Member Updated Issue");

      expect(response.body.issue.priority).toBe("HIGH");
    });

    it("rejects an assignee outside the workspace during update", async () => {
      const fixture = await createFixture();

      const issue = await prisma.issue.findUniqueOrThrow({
        where: {
          id: fixture.issueId,
        },
      });

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.owner.token}`)
        .set("If-Unmodified-Since", issue.updatedAt.toISOString())
        .send({
          assigneeId: fixture.outsider.id,
        })
        .expect(400);

      expect(response.body).toEqual({
        message: "Assignee must be a member of this workspace",
      });
    });

    it("rejects a stale issue update with a conflict response", async () => {
      const fixture = await createFixture();

      const originalIssue = await prisma.issue.findUniqueOrThrow({
        where: {
          id: fixture.issueId,
        },
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const changedIssue = await prisma.issue.update({
        where: {
          id: fixture.issueId,
        },
        data: {
          title: "Changed By Another Collaborator",
        },
      });

      expect(changedIssue.updatedAt.getTime()).not.toBe(
        originalIssue.updatedAt.getTime(),
      );

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .set("If-Unmodified-Since", originalIssue.updatedAt.toISOString())
        .send({
          title: "Stale Client Update",
        })
        .expect(409);

      expect(response.body).toEqual({
        message:
          "This issue was changed by another collaborator. Reload the latest version before saving.",
        code: "ISSUE_EDIT_CONFLICT",
        currentUpdatedAt: changedIssue.updatedAt.toISOString(),
      });

      const storedIssue = await prisma.issue.findUniqueOrThrow({
        where: {
          id: fixture.issueId,
        },
      });

      expect(storedIssue.title).toBe("Changed By Another Collaborator");
    });

    it("blocks issue updates in an archived project", async () => {
      const fixture = await createFixture();

      const issue = await prisma.issue.findUniqueOrThrow({
        where: {
          id: fixture.issueId,
        },
      });

      await prisma.project.update({
        where: {
          id: fixture.projectId,
        },
        data: {
          status: "ARCHIVED",
        },
      });

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .set("If-Unmodified-Since", issue.updatedAt.toISOString())
        .send({
          title: "Archived Update",
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "Archived projects cannot be modified",
      });
    });

    it("blocks an outsider from updating an issue", async () => {
      const fixture = await createFixture();

      const issue = await prisma.issue.findUniqueOrThrow({
        where: {
          id: fixture.issueId,
        },
      });

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .set("If-Unmodified-Since", issue.updatedAt.toISOString())
        .send({
          title: "Outsider Update",
        })
        .expect(404);

      expect(response.body).toEqual({
        message: "Project not found or access denied",
      });
    });
  });

  describe("moving issues", () => {
    it("allows a workspace member to move an issue", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}/move`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          status: "IN_PROGRESS",
          position: 0,
        })
        .expect(200);

      expect(response.body.message).toBe("Issue moved successfully");

      expect(response.body.issue.status).toBe("IN_PROGRESS");

      expect(response.body.issue.position).toBe(0);
    });

    it("does not move an issue through another project URL", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.secondProjectId}/issues/${fixture.issueId}/move`,
        )
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          status: "DONE",
          position: 0,
        })
        .expect(404);

      expect(response.body).toEqual({
        message: "Issue not found",
      });

      const issue = await prisma.issue.findUniqueOrThrow({
        where: {
          id: fixture.issueId,
        },
      });

      expect(issue.status).toBe("TODO");
    });

    it("blocks an outsider from moving an issue", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}/move`)
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .send({
          status: "DONE",
          position: 0,
        })
        .expect(404);

      expect(response.body).toEqual({
        message: "Project not found or access denied",
      });
    });

    it("blocks moving issues in an archived project", async () => {
      const fixture = await createFixture();

      await prisma.project.update({
        where: {
          id: fixture.projectId,
        },
        data: {
          status: "ARCHIVED",
        },
      });

      const response = await request(app)
        .patch(`${issueBaseUrl(fixture)}/${fixture.issueId}/move`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .send({
          status: "DONE",
          position: 0,
        })
        .expect(403);

      expect(response.body).toEqual({
        message: "Archived projects cannot be modified",
      });
    });
  });

  describe("deleting issues", () => {
    it("allows a workspace member to delete an issue", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .delete(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(200);

      expect(response.body).toEqual({
        message: "Issue deleted successfully",
      });

      const issue = await prisma.issue.findUnique({
        where: {
          id: fixture.issueId,
        },
      });

      expect(issue).toBeNull();
    });

    it("does not delete an issue through another project URL", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .delete(
          `/api/workspaces/${fixture.workspaceId}/projects/${fixture.secondProjectId}/issues/${fixture.issueId}`,
        )
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: "Issue not found",
      });

      const issue = await prisma.issue.findUnique({
        where: {
          id: fixture.issueId,
        },
      });

      expect(issue).not.toBeNull();
    });

    it("blocks an outsider from deleting an issue", async () => {
      const fixture = await createFixture();

      const response = await request(app)
        .delete(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.outsider.token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: "Project not found or access denied",
      });
    });

    it("blocks deleting issues from an archived project", async () => {
      const fixture = await createFixture();

      await prisma.project.update({
        where: {
          id: fixture.projectId,
        },
        data: {
          status: "ARCHIVED",
        },
      });

      const response = await request(app)
        .delete(`${issueBaseUrl(fixture)}/${fixture.issueId}`)
        .set("Authorization", `Bearer ${fixture.member.token}`)
        .expect(403);

      expect(response.body).toEqual({
        message: "Archived projects cannot be modified",
      });

      const issue = await prisma.issue.findUnique({
        where: {
          id: fixture.issueId,
        },
      });

      expect(issue).not.toBeNull();
    });
  });
});
