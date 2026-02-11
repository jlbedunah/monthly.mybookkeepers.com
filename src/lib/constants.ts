export const STATUS_CONFIG = {
  need_statements: {
    label: "Need Statements",
    color: "bg-amber-100 text-amber-800",
    emoji: "📋",
  },
  categorizing: {
    label: "Categorizing",
    color: "bg-red-100 text-red-800",
    emoji: "🏷️",
  },
  categorized: {
    label: "Categorized",
    color: "bg-rose-100 text-rose-800",
    emoji: "✅",
  },
  reconciling: {
    label: "Reconciling",
    color: "bg-purple-100 text-purple-800",
    emoji: "🔄",
  },
  reconciled: {
    label: "Reconciled",
    color: "bg-teal-100 text-teal-800",
    emoji: "✔️",
  },
  finished: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    emoji: "🎉",
  },
} as const;

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/csv",
  "image/png",
  "image/jpeg",
];

export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".csv", ".png", ".jpg", ".jpeg"];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
