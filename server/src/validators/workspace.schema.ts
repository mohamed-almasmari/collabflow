import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(100, "Workspace name must be 100 characters or less"),

  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional(),
});

export const updateWorkspaceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Workspace name must be at least 2 characters")
      .max(100, "Workspace name must be 100 characters or less")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or less")
      .nullable()
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one workspace field must be provided",
  });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const addWorkspaceMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((email) => email.toLowerCase()),

  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export type AddWorkspaceMemberInput = z.infer<typeof addWorkspaceMemberSchema>;

export const updateWorkspaceMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type UpdateWorkspaceMemberRoleInput = z.infer<
  typeof updateWorkspaceMemberRoleSchema
>;
