import { platformPrisma } from "@/lib/platform-db";

export interface AuthContext {
  userId: string;
  firmId: string;
  role: string;
}

export async function getAuthContext(userId: string): Promise<AuthContext> {
  const user = await platformPrisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firmId: true, role: true, status: true, firm: { select: { status: true } } }
  });
  if (!user) throw new Error("Unauthorized");
  if (user.status !== "active") throw new Error("USER_DEACTIVATED");
  if (user.firm.status === "SUSPENDED") throw new Error("FIRM_SUSPENDED");
  return { userId: user.id, firmId: user.firmId, role: user.role };
}
