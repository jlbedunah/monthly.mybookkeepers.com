import * as schema from "./schema";

function initDb() {
  if (process.env.USE_MOCK === "true") return null!;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require("postgres");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/postgres-js");
  const client = postgres(process.env.DATABASE_URL!);
  return drizzle(client, { schema });
}

export const db: ReturnType<typeof initDb> = initDb();
