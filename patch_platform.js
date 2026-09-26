const fs = require('fs');
let c = fs.readFileSync('src/services/platform.service.ts', 'utf8');

const target = `address: firmData.address || "TBD",
          phone: firmData.phone || "TBD",
          email: firmData.email || adminEmail,
          status: "ACTIVE",
          onboardingState: "NOT_STARTED",
          enabledFeatures: ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE"]`;

const replacement = `address: firmData.address || "TBD",
          phone: firmData.phone || "TBD",
          email: firmData.email || adminEmail,
          planType: firmData.planType || "starter",
          status: "ACTIVE",
          onboardingState: "NOT_STARTED",
          enabledFeatures: (firmData.planType === "professional" || firmData.planType === "enterprise")
            ? ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE", "CRM", "FINANCE", "DOCUMENTS", "RFI", "MEETINGS", "LEAVE", "TIME", "VARIATION_ORDERS"]
            : ["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE"]`;

c = c.replace(target, replacement);
fs.writeFileSync('src/services/platform.service.ts', c);
console.log("Patched platform.service.ts");
