import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { env, featureFlags } from "@/lib/env";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL!,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

export function getPrismaClient() {
  if (!featureFlags.hasDatabase) {
    return null;
  }

  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }

  return global.prisma;
}
