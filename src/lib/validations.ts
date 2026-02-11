import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  companyName: z.string().min(1, "Company name is required").max(200),
  qboName: z.string().max(200).optional().default(""),
  phone: z.string().max(20).optional().default(""),
});

export const createMonthSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const uploadStatementSchema = z.object({
  institutionName: z.string().min(1, "Institution name is required").max(200),
  accountLast4: z.string().regex(/^\d{4}$/, "Must be exactly 4 digits"),
  institutionType: z.enum(["bank", "credit_card", "loan", "other"]),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateMonthInput = z.infer<typeof createMonthSchema>;
export type UploadStatementInput = z.infer<typeof uploadStatementSchema>;
