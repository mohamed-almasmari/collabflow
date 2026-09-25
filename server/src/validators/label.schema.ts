import { z } from "zod";

export const createLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Label name is required")
    .max(40, "Label name cannot exceed 40 characters"),

  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Label color must be a valid hex color"),
});
