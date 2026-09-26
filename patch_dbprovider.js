const fs = require('fs');
let c = fs.readFileSync('src/components/providers/DBProvider.tsx', 'utf8');

c = c.replace(/const zustandFirm = \{/, `const zustandFirm = {
          slug: firm.slug || "",
          status: (firm.status || "ACTIVE") as any,
          onboardingState: (firm.onboardingState || "COMPLETED") as any,
          enabledFeatures: firm.enabledFeatures || [],`);

fs.writeFileSync('src/components/providers/DBProvider.tsx', c);
console.log("Patched zustandFirm");
