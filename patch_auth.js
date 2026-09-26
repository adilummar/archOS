const fs = require('fs');
let c = fs.readFileSync('src/services/auth.service.ts', 'utf8');

c = c.replace(/import \{ prisma \} from "@\/lib\/db";/, 'import { platformPrisma } from "@/lib/platform-db";');
c = c.replace(/const user = await prisma\.user\.findUnique/g, 'const user = await platformPrisma.user.findUnique');

fs.writeFileSync('src/services/auth.service.ts', c);
console.log("Patched auth.service.ts to use platformPrisma");
