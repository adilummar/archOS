
const fs = require("fs");
const file = "src/app/actions/bootstrap.actions.ts";
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  /import { prisma } from "@\/lib\/db";/,
  `import { prisma } from "@/lib/db";\nimport { getSession } from "@/lib/session";`
);
const regex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
let match;
let patches = [];
while ((match = regex.exec(content)) !== null) {
  const startIdx = match.index + match[0].length;
  patches.push({ index: startIdx, funcName: match[1] });
}
for (let i = patches.length - 1; i >= 0; i--) {
  const patch = patches[i];
  const injection = `\n  const session = await getSession();\n  if (!session.userId) throw new Error("Unauthorized");\n`;
  content = content.substring(0, patch.index) + injection + content.substring(patch.index);
}
fs.writeFileSync(file, content, "utf8");
console.log("Patched bootstrap");

