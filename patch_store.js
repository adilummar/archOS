
const fs = require("fs");
let content = fs.readFileSync("src/lib/store/firm.store.ts", "utf-8");

content = content.replace(
  /users:\s*CDA_USERS,/,
  `users: [],`
);

content = content.replace(
  /firms:\s*\[CDA_FIRM\],/,
  `firms: [],`
);

fs.writeFileSync("src/lib/store/firm.store.ts", content);
console.log("Patched firm.store.ts");

