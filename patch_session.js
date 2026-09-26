const fs = require('fs');
let c = fs.readFileSync('src/lib/session.ts', 'utf8');

c = c.replace(/maxAge: 60 \* 60 \* 8, \/\/ 8 hours/g, 'maxAge: 60 * 60 * 24 * 30, // 30 days');

fs.writeFileSync('src/lib/session.ts', c);
console.log("Patched session expiration");
