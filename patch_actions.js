
const fs = require("fs");
const path = require("path");

function patchFile(file) {
  let content = fs.readFileSync(file, "utf8");

  // Add import if missing
  if (!content.includes("getSession")) {
    content = content.replace(
      /import { prisma } from "@\/lib\/db";/,
      `import { prisma } from "@/lib/db";\nimport { getSession } from "@/lib/session";`
    );
  }

  // Find all exported async functions
  const regex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
  let match;
  let patches = [];

  while ((match = regex.exec(content)) !== null) {
    const startIdx = match.index + match[0].length;
    // We only inject if it does NOT already have getSession
    const nextLine = content.substring(startIdx, startIdx + 100);
    if (!nextLine.includes("getSession()")) {
      patches.push({
        index: startIdx,
        funcName: match[1]
      });
    }
  }

  // Apply patches backwards
  for (let i = patches.length - 1; i >= 0; i--) {
    const patch = patches[i];
    const injection = `\n  const session = await getSession();\n  if (!session.userId) throw new Error("Unauthorized");\n  const currentUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, firmId: true, role: true } });\n  if (!currentUser) throw new Error("Unauthorized");\n`;
    content = content.substring(0, patch.index) + injection + content.substring(patch.index);
  }

  // Also replace any instances where firmId is taken from arguments
  // This is a bit tricky, so we will just do a targeted replacement for known params
  content = content.replace(/where:\s*\{\s*firmId\s*,/g, "where: { firmId: currentUser.firmId,");
  content = content.replace(/where:\s*\{\s*firmId:\s*firmId\s*,/g, "where: { firmId: currentUser.firmId,");
  content = content.replace(/data:\s*\{\s*firmId\s*,/g, "data: { firmId: currentUser.firmId,");

  fs.writeFileSync(file, content, "utf8");
  console.log(`Patched ${file}`);
}

const actionFiles = [
  "src/app/actions/attendance.actions.ts",
  "src/app/actions/log.actions.ts",
  "src/app/actions/project.actions.ts",
  "src/app/actions/staff.actions.ts",
  "src/app/actions/task.actions.ts",
  "src/app/actions/user.actions.ts"
];

for (const file of actionFiles) {
  if (fs.existsSync(file)) {
    patchFile(file);
  }
}

