import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  schema: "./src/schema.ts",   // path to your schema file
  out: "./drizzle",            // folder for migrations
  dialect: "postgresql",       // ✅ replace "driver" with dialect
  dbCredentials: {
    url: process.env.DATABASE_URL!, // ✅ correct key is "url"
  },
  verbose: true,
  strict: true,
} satisfies Config;
