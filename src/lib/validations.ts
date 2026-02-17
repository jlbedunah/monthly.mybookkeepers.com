import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  companyName: z.string().min(1, "Company name is required").max(200),
  qboName: z.string().max(200).optional().default(""),
  phone: z.string().max(20).optional().default(""),
  billingEmail: z
    .string()
    .max(200)
    .optional()
    .default("")
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid email",
    }),
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

export const updatePackageStatusSchema = z.object({
  status: z.enum([
    "need_statements",
    "categorizing",
    "categorized",
    "reconciling",
    "reconciled",
    "finished",
  ]),
});

export const startMonthlySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(200),
  companyName: z.string().min(1, "Company name is required").max(200),
  cardNumber: z.string().min(13).max(19),
  expirationDate: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM format"),
  cardCode: z.string().min(3).max(4),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateMonthInput = z.infer<typeof createMonthSchema>;
export type UploadStatementInput = z.infer<typeof uploadStatementSchema>;
export type UpdatePackageStatusInput = z.infer<typeof updatePackageStatusSchema>;
