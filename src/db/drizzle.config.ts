import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

const useSupabase = Boolean(
  process.env.SUPABASE_DB_HOST && !process.env.SUPABASE_DB_HOST.includes("your-project-id")
);

const host = useSupabase ? process.env.SUPABASE_DB_HOST : process.env.SQL_HOST;
const port = useSupabase ? parseInt(process.env.SUPABASE_DB_PORT || "6543", 10) : 5432;
const database = useSupabase
  ? process.env.SUPABASE_DB_NAME || "postgres"
  : process.env.SQL_DB_NAME;
const user = useSupabase
  ? process.env.SUPABASE_DB_USER || "postgres"
  : process.env.SQL_ADMIN_USER;
const password = useSupabase
  ? process.env.SUPABASE_DB_PASSWORD
  : process.env.SQL_ADMIN_PASSWORD;

if (!host) {
  throw new Error("SUPABASE_DB_HOST or SQL_HOST must be set in environment variables.");
}
if (!database) {
  throw new Error("SUPABASE_DB_NAME or SQL_DB_NAME must be set in environment variables.");
}
if (!user) {
  throw new Error("SUPABASE_DB_USER or SQL_ADMIN_USER must be set in environment variables.");
}
if (!password) {
  throw new Error("SUPABASE_DB_PASSWORD or SQL_ADMIN_PASSWORD must be set in environment variables.");
}

console.log(`Using ${useSupabase ? "Supabase PostgreSQL" : "Cloud SQL"} user: ${user} to connect to database ${database}.`);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host,
    port,
    user,
    password,
    database,
    ssl: useSupabase ? { rejectUnauthorized: false } : false,
  },
  verbose: true,
});
