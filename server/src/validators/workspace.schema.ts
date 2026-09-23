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

export type CreateWorkspaceInput = z.infer<
  typeof createWorkspaceSchema
>;