import { z } from "zod";

export const createChecklistItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Checklist item is required")
    .max(200, "Checklist item cannot exceed 200 characters"),
});

export const updateChecklistItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Checklist item is required")
    .max(200)
    .optional(),

  completed: z.boolean().optional(),
});
