
const fs = require("fs");
let content = fs.readFileSync("src/app/[firmSlug]/login/page.tsx", "utf-8");

content = content.replace(
  /const firmId = \`firm-\$\{firmSlug\}\`;/,
  `// firmId removed`
);

content = content.replace(
  /const firm = firms\.find\(\(f\) => f\.id === firmId\);/,
  `const firm = firms[0];`
);

content = content.replace(
  /const roleUsers = users\.filter\(\(u\) => u\.firmId === firmId && u\.role === selectedRole && u\.status === "active"\);/,
  `const roleUsers = firm ? users.filter((u) => u.firmId === firm.id && u.role === selectedRole && u.status === "active") : [];`
);

fs.writeFileSync("src/app/[firmSlug]/login/page.tsx", content);
console.log("Patched login firm logic");

