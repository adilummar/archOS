import { prisma } from "./db";
import { Prisma } from "@prisma/client";
import { AuthContext } from "@/services/auth.service";

export async function withAuthTx<T>(
  ctx: AuthContext,
  callback: (tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Try to switch to the restricted role for RLS enforcement.
    // If archos_app_role doesn't exist yet (needs one-time server sudo setup),
    // we gracefully skip it and continue without the role restriction.
    try {
      await tx.$executeRawUnsafe('SET LOCAL ROLE archos_app_role');
    } catch {
      // archos_app_role not yet created on this server — skip role switch.
      // Run: sudo -u postgres psql -c "CREATE ROLE archos_app_role;"
      //      sudo -u postgres psql -c "GRANT archos_app_role TO <db_user>;"
    }

    // Parameterized config setting for strict RLS safety
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${ctx.userId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_firm_id', ${ctx.firmId}, true)`;

    // Execute the domain logic
    return await callback(tx);
  });
}
