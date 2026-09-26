const fs = require('fs');
let c = fs.readFileSync('src/app/api/v1/onboarding/password/route.ts', 'utf8');

c = c.replace(/import \{ prisma \} from "@\/lib\/db";/, 'import { platformPrisma } from "@/lib/platform-db";');
c = c.replace(/const user = await prisma\.user\.findUnique/g, 'const user = await platformPrisma.user.findUnique');

fs.writeFileSync('src/app/api/v1/onboarding/password/route.ts', c);
console.log("Patched onboarding password route");
