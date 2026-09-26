import { prisma } from "./db";
import { platformPrisma } from "./platform-db";
import { Prisma } from "@prisma/client";
import { AuthContext } from "@/services/auth.service";

// Cache whether archos_app_role exists so we only check once per process lifecycle
let roleExists: boolean | null = null;

async function checkRoleExists(): Promise<boolean> {
  if (roleExists !== null) return roleExists;
  try {
    const result = await platformPrisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM pg_roles WHERE rolname = 'archos_app_role'
    `;
    roleExists = Number(result[0].count) > 0;
  } catch {
    roleExists = false;
  }
  return roleExists;
}

export async function withAuthTx<T>(
  ctx: AuthContext,
  callback: (tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  const hasRole = await checkRoleExists();

  return prisma.$transaction(async (tx) => {
    if (hasRole) {
      // Switch to restricted role for RLS enforcement
      await tx.$executeRawUnsafe('SET LOCAL ROLE archos_app_role');
    }

    // Parameterized config setting for strict RLS safety
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_firm_id', ${ctx.firmId}, true)`;

    // Execute the domain logic
    return await callback(tx);
  });
}
