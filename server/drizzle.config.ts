import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.DATABASE_URL)

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql", // ✅ Required
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
