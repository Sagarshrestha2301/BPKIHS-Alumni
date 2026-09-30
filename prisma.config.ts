import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations must use a direct connection. Locally this can be the same
    // value as DATABASE_URL; production may use a provider-specific direct URL.
    url: env("DIRECT_DATABASE_URL"),
  },
});
