
const fs = require("fs");
let content = fs.readFileSync("src/app/actions/project.actions.ts", "utf8");

// Revert all to normal
content = content.replace(
  /stages: \{ orderBy: \{ order: "asc" \}, include: \{ tasks: \{ orderBy: \{ order: "asc" \} \} \} \},/g,
  `stages: { orderBy: { order: "asc" } },`
);

// Apply only to getTemplatesByFirm
const functionStart = content.indexOf("export async function getTemplatesByFirm");
if (functionStart !== -1) {
  const functionSubstr = content.substring(functionStart);
  const updatedSubstr = functionSubstr.replace(
    /stages: \{ orderBy: \{ order: "asc" \} \},/,
    `stages: { orderBy: { order: "asc" }, include: { tasks: { orderBy: { order: "asc" } } } },`
  );
  content = content.substring(0, functionStart) + updatedSubstr;
}

fs.writeFileSync("src/app/actions/project.actions.ts", content);

