import * as schema from "./schema";

function initDb() {
  if (process.env.USE_MOCK === "true") return null!;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/vercel-postgres");
  return drizzle(sql, { schema });
}

export const db: ReturnType<typeof initDb> = initDb();
