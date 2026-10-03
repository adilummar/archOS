import { AuthContext } from "./auth.service";
import { withAuthTx } from "@/lib/db-tx";

export async function requireFeature(ctx: AuthContext, feature: string) {
  const firm = await withAuthTx(ctx, async tx => {
    return tx.firm.findUnique({
      where: { id: ctx.firmId },
      select: { enabledFeatures: true }
    });
  });

  if (!firm || !firm.enabledFeatures.includes(feature)) {
    throw new Error(`FEATURE_DISABLED:${feature}`);
  }
}
