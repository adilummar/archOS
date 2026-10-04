import crypto from "crypto";
import { platformPrisma } from "@/lib/platform-db";
import { getPlatformSession } from "@/lib/session";
import bcrypt from "bcryptjs";

// Utility to verify platform authorization
export async function requirePlatformAuth() {
  const session = await getPlatformSession();
  if (!session.platformAdminId) {
    throw new Error("UNAUTHORIZED");
  }
  const admin = await platformPrisma.platformAdmin.findUnique({
    where: { id: session.platformAdminId },
  });
  if (!admin || !admin.active) {
    throw new Error("UNAUTHORIZED");
  }
  return admin;
}

export const PlatformService = {
  // FIRM PROVISIONING
  async createFirmWithAdmin(firmData: any, adminEmail: string, adminName: string) {
    let finalSlug = firmData.slug;
    
    if (!finalSlug) {
      // Generate a unique URL slug
      let baseSlug = firmData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      if (!baseSlug) baseSlug = "firm";
      
      finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const existing = await platformPrisma.firm.findUnique({ where: { slug: finalSlug } });
        if (!existing) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    } else {
      const existing = await platformPrisma.firm.findUnique({ where: { slug: finalSlug } });
      if (existing) {
        throw new Error("DUPLICATE_FIRM_SLUG");
      }
    }

    // Atomic transaction for provisioning
    return platformPrisma.$transaction(async (tx) => {
      // 1. Check if admin email already exists globally across users
      const existingUser = await tx.user.findUnique({ where: { email: adminEmail.toLowerCase().trim() } });
      if (existingUser) {
        throw new Error("DUPLICATE_ADMIN_EMAIL");
      }

      // 2. Create Firm
      const firm = await tx.firm.create({
        data: {
          name: firmData.name,
          slug: finalSlug,
          address: firmData.address || "TBD",
          phone: firmData.phone || "TBD",
          email: firmData.email || adminEmail,
          planType: firmData.planType || "starter",
          status: "ACTIVE",
          onboardingState: "NOT_STARTED",
          enabledFeatures: ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE"]
        }
      });

      // 3. Create initial Firm Admin with temporary password
      const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 char random password
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      
      const admin = await tx.user.create({
        data: {
          firmId: firm.id,
          name: adminName,
          email: adminEmail.toLowerCase().trim(),
          role: "admin",
          status: "active",
          passwordHash
        }
      });

      return { ...firm, _tempAdminPassword: tempPassword };
    });
  },

  async listFirms() {
    return platformPrisma.firm.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        onboardingState: true,
        createdAt: true,
        users: {
          where: { role: 'admin' },
          select: { name: true, email: true },
          take: 1
        }
      }
    });
  },

  async updateFirm(id: string, data: any) {
    // Feature entitlements are now managed independently from planType
    return platformPrisma.firm.update({
      where: { id },
      data
    });
  },

  async updateFirmFeatures(id: string, enabledFeatures: string[], adminId: string) {
    const firm = await platformPrisma.firm.findUnique({ where: { id } });
    if (!firm) throw new Error("Not found");

    const oldFeatures = firm.enabledFeatures.join(", ");
    const newFeatures = enabledFeatures.join(", ");

    const updatedFirm = await platformPrisma.firm.update({
      where: { id },
      data: { enabledFeatures }
    });

    await platformPrisma.activityLog.create({
      data: {
        firmId: id,
        userId: null,
        entity: "firm",
        entityId: id,
        action: "updated_features",
        description: `PlatformAdmin (${adminId}) updated features from [${oldFeatures}] to [${newFeatures}]`
      }
    });

    return updatedFirm;
  },

  async deleteFirm(id: string) {
    // Note: Depends on onDelete: Cascade for related records in Prisma schema
    return platformPrisma.firm.delete({
      where: { id }
    });
  },

  async getFirm(id: string) {
    return platformPrisma.firm.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'admin' }
        }
      }
    });
  },

  async setFirmStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    return platformPrisma.firm.update({
      where: { id },
      data: { status }
    });
  }
};
