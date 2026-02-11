export type PackageStatus =
  | "need_statements"
  | "categorizing"
  | "categorized"
  | "reconciling"
  | "reconciled"
  | "finished";

export type InstitutionType = "bank" | "credit_card" | "loan" | "other";

export interface Client {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  qboName: string | null;
  phone: string | null;
}

export interface Statement {
  id: string;
  monthlyPackageId: string;
  institutionName: string;
  accountLast4: string;
  institutionType: InstitutionType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface MonthlyPackage {
  id: string;
  userId: string;
  month: number;
  year: number;
  status: PackageStatus;
  submittedAt: string | null;
  createdAt: string;
  statements: Statement[];
}

export interface MonthlyPackageSummary {
  id: string;
  month: number;
  year: number;
  status: PackageStatus;
  statementCount: number;
}
