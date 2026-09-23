import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name must be 100 characters or less"),

  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(100, "Project name must be 100 characters or less")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or less")
      .nullable()
      .optional(),

    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.status !== undefined,
    {
      message: "At least one project field must be provided",
    },
  );

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
