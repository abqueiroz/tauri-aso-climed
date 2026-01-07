import path from "node:path";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: path.join(__dirname, ".local", "dev.sqlite"),
  },
  verbose: true,
  strict: true,
});
