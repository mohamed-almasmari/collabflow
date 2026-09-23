import { z } from "zod";

export const createIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Issue title must be at least 2 characters")
    .max(150, "Issue title must be 150 characters or less"),

  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or less")
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .optional(),

  assigneeId: z
    .string()
    .uuid("Assignee ID must be a valid UUID")
    .nullable()
    .optional(),
});

export type CreateIssueInput = z.infer<
  typeof createIssueSchema
>;