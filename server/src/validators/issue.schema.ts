import { z } from "zod";

const issuePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const issueStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const optionalDescriptionSchema = z
  .string()
  .trim()
  .max(5000, "Description cannot exceed 5000 characters")
  .nullable()
  .optional();

const optionalAssigneeSchema = z.string().uuid().nullable().optional();

const dueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must use YYYY-MM-DD format")
  .nullable()
  .optional();

export const createIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),

  description: optionalDescriptionSchema,

  priority: issuePrioritySchema.optional(),

  assigneeId: optionalAssigneeSchema,

  dueDate: dueDateSchema,
});

export const updateIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),

  description: optionalDescriptionSchema,

  priority: issuePrioritySchema.optional(),

  status: issueStatusSchema.optional(),

  assigneeId: optionalAssigneeSchema,

  dueDate: dueDateSchema,
});

export const moveIssueSchema = z.object({
  status: issueStatusSchema,

  position: z.number().int().min(0),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

export type MoveIssueInput = z.infer<typeof moveIssueSchema>;
