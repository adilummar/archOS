const fs = require('fs');
let c = fs.readFileSync('src/services/platform.service.ts', 'utf8');

c = c.replace(/async updateFirmPlan\(id: string, planType: string\) \{/, `async updateFirm(id: string, data: any) {`);

// Re-write the update method logic
const target = `    const enabledFeatures = (planType === "professional" || planType === "enterprise")
      ? ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE", "CRM", "FINANCE", "DOCUMENTS", "RFI", "MEETINGS", "LEAVE", "TIME", "VARIATION_ORDERS"]
      : ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE"];
      
    return platformPrisma.firm.update({
      where: { id },
      data: { planType, enabledFeatures }
    });`;

const replacement = `    // If planType is being updated, recalculate enabledFeatures
    if (data.planType) {
      data.enabledFeatures = (data.planType === "professional" || data.planType === "enterprise")
        ? ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE", "CRM", "FINANCE", "DOCUMENTS", "RFI", "MEETINGS", "LEAVE", "TIME", "VARIATION_ORDERS"]
        : ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE"];
    }
      
    return platformPrisma.firm.update({
      where: { id },
      data
    });
  },

  async deleteFirm(id: string) {
    // Note: Depends on onDelete: Cascade for related records in Prisma schema
    return platformPrisma.firm.delete({
      where: { id }
    });`;

c = c.replace(target, replacement);

fs.writeFileSync('src/services/platform.service.ts', c);
console.log("Patched PlatformService");
