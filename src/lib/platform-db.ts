import { PrismaClient } from "@prisma/client";

// Separate Prisma Client instance for Platform operations.
// Connects using PLATFORM_DATABASE_URL which uses the BYPASSRLS role.
// This must NEVER be imported by tenant routes.
const globalForPlatformPrisma = global as unknown as { platformPrisma: PrismaClient };

export const platformPrisma =
  globalForPlatformPrisma.platformPrisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.PLATFORM_DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPlatformPrisma.platformPrisma = platformPrisma;
