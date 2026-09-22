import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or less"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((email) => email.toLocaleLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Pawwsord must be 128 characters or less"),
});

export type RegisterInput = z.infer<typeof registerSchema>;