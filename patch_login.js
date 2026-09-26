const fs = require('fs');
let c = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');

c = c.replace(/import \{ prisma \} from "@\/lib\/db";/, 'import { platformPrisma } from "@/lib/platform-db";');
c = c.replace(/await prisma\.user\.findUnique/g, 'await platformPrisma.user.findUnique');

fs.writeFileSync('src/app/api/auth/login/route.ts', c);
console.log("Patched auth login route to use platformPrisma");
