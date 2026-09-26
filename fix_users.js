const fs = require('fs');
let c = fs.readFileSync('src/app/api/v1/onboarding/users/route.ts', 'utf8');
c = c.replace(/const createdUsers = \[\];/, 'const createdUsers: any[] = [];');
fs.writeFileSync('src/app/api/v1/onboarding/users/route.ts', c);
console.log("Patched users route");
