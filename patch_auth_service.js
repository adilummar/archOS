const fs = require('fs');
let c = fs.readFileSync('src/services/auth.service.ts', 'utf8');

c = c.replace(/select: \{ id: true, firmId: true, role: true \}/, `select: { id: true, firmId: true, role: true, firm: { select: { status: true } } }`);

c = c.replace(/if \(!user\) throw new Error\("Unauthorized"\);/, `if (!user) throw new Error("Unauthorized");\n  if (user.firm.status === "SUSPENDED") throw new Error("FIRM_SUSPENDED");`);

fs.writeFileSync('src/services/auth.service.ts', c);
