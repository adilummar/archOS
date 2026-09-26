const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/login/page.tsx', 'utf8');

c = c.replace(/<input\s+type="email"/g, '<input\n                    name="email"\n                    autoComplete="username"\n                    type="email"');
c = c.replace(/<input\s+type=\{showPassword \? "text" : "password"\}/g, '<input\n                      name="password"\n                      autoComplete="current-password"\n                      type={showPassword ? "text" : "password"}');

fs.writeFileSync('src/app/[firmSlug]/login/page.tsx', c);
console.log("Patched tenant login page with autocomplete attributes");
