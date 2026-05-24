import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __pg__: ReturnType<typeof postgres> | undefined;
}

// Reuse the Postgres connection across hot reloads in dev.
const client =
  global.__pg__ ??
  (connectionString
    ? postgres(connectionString, { prepare: false, max: 4 })
    : (null as unknown as ReturnType<typeof postgres>));

if (process.env.NODE_ENV !== "production" && client) global.__pg__ = client;

export const db = client
  ? drizzle(client, { schema })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            "DATABASE_URL is not configured. Add it to .env.local — see README.",
          );
        },
      },
    ) as ReturnType<typeof drizzle<typeof schema>>);

export { schema };
