import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { AuthContext } from "@/services/auth.service";

export async function withAuthTx<T>(
  ctx: AuthContext,
  callback: (tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Switch to restricted role for RLS enforcement
    await tx.$executeRawUnsafe('SET LOCAL ROLE archos_app_role');
    
    // Parameterized config setting for strict RLS safety
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_firm_id', ${ctx.firmId}, true)`;
    
    // Execute the domain logic
    return await callback(tx);
  });
}
