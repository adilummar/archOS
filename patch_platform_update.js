const fs = require('fs');
let c = fs.readFileSync('src/services/platform.service.ts', 'utf8');

const target = `  async getFirm(id: string) {`;

const replacement = `  async updateFirmPlan(id: string, planType: string) {
    const enabledFeatures = (planType === "professional" || planType === "enterprise")
      ? ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE", "CRM", "FINANCE", "DOCUMENTS", "RFI", "MEETINGS", "LEAVE", "TIME", "VARIATION_ORDERS"]
      : ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE"];
      
    return platformPrisma.firm.update({
      where: { id },
      data: { planType, enabledFeatures }
    });
  },

  async getFirm(id: string) {`;

c = c.replace(target, replacement);
fs.writeFileSync('src/services/platform.service.ts', c);
console.log("Patched PlatformService");
