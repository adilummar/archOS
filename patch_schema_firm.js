const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Add fields to Firm
if (!c.includes('status             String   @default("ACTIVE")')) {
  c = c.replace(/model Firm \{[\s\S]*?createdAt          DateTime @default\(now\(\)\)/, (match) => {
    return match.replace(/createdAt          DateTime @default\(now\(\)\)/, 
`status             String   @default("ACTIVE") // ACTIVE, SUSPENDED
  onboardingState    String   @default("NOT_STARTED") // NOT_STARTED, IN_PROGRESS, COMPLETED
  enabledFeatures    String[] @default(["DASHBOARD", "PROJECTS", "TASKS", "STAFF", "ATTENDANCE"])
  createdAt          DateTime @default(now())`);
  });
  fs.writeFileSync('prisma/schema.prisma', c);
  console.log("Updated Firm model");
}
