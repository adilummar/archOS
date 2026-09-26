const fs = require('fs');
let c = fs.readFileSync('src/app/api/auth/me/route.ts', 'utf8');

c = c.replace(/import \{ prisma \} from "@\/lib\/db";/, 'import { platformPrisma } from "@/lib/platform-db";');
c = c.replace(/const user = await prisma\.user\.findUnique/g, 'const user = await platformPrisma.user.findUnique');

fs.writeFileSync('src/app/api/auth/me/route.ts', c);
console.log("Patched auth/me route");
