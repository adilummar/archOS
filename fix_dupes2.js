const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/login/page.tsx', 'utf8');

// I'll just remove the ones I injected precisely.
c = c.replace(/<input\n                    name="email"\n                    autoComplete="username"\n                    type="email"/g, '<input name="email" type="email"');

c = c.replace(/<input\n                      name="password"\n                      autoComplete="current-password"\n                      type=\{showPassword \? "text" : "password"\}/g, '<input name="password" type={showPassword ? "text" : "password"}');

fs.writeFileSync('src/app/[firmSlug]/login/page.tsx', c);
console.log("Cleaned up duplicates");
