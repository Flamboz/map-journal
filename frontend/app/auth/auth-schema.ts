import * as z from "zod";

const emailSchema = z.email("Invalid email address");

export const authFormSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export type AuthFormValues = z.infer<typeof authFormSchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});