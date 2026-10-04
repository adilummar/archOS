import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { AuthContext } from "@/services/auth.service";

export class TenantSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantSecurityError";
  }
}

export async function withAuthTx<T>(
  ctx: AuthContext,
  callback: (tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  if (!ctx?.userId || !ctx?.firmId) {
    throw new TenantSecurityError("Unauthorized: missing tenant identity");
  }

  return prisma.$transaction(async (tx) => {
    try {
      await tx.$executeRawUnsafe("SET LOCAL ROLE archos_app_role");
    } catch (err) {
      const detail = err instanceof Error ? err.message : "unknown error";
      throw new TenantSecurityError(`Tenant RLS role unavailable: ${detail}`);
    }

    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_firm_id', ${ctx.firmId}, true)`;

    return await callback(tx);
  });
}
