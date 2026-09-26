const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/login/page.tsx', 'utf8');

c = c.replace(/type="email"\s+type="email"/g, 'type="email"');
c = c.replace(/type=\{showPassword \? "text" : "password"\}\s+type=\{showPassword \? "text" : "password"\}/g, 'type={showPassword ? "text" : "password"}');

fs.writeFileSync('src/app/[firmSlug]/login/page.tsx', c);
console.log("Cleaned up duplicated types");
