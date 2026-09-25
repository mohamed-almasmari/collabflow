import { z } from "zod";

const issuePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const issueStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must use YYYY-MM-DD format")
  .nullable()
  .optional();

const labelIdsSchema = z
  .array(z.string().uuid())
  .max(10, "An issue can have at most 10 labels")
  .optional();

export const createIssueSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),

  description: z.string().trim().max(5000).nullable().optional(),

  priority: issuePrioritySchema.optional(),

  assigneeId: z.string().uuid().nullable().optional(),

  dueDate: dueDateSchema,

  labelIds: labelIdsSchema,
});

export const updateIssueSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),

  description: z.string().trim().max(5000).nullable().optional(),

  priority: issuePrioritySchema.optional(),

  status: issueStatusSchema.optional(),

  assigneeId: z.string().uuid().nullable().optional(),

  dueDate: dueDateSchema,

  labelIds: labelIdsSchema,
});

export const moveIssueSchema = z.object({
  status: issueStatusSchema,

  position: z.number().int().min(0),
});
