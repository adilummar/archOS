
const fs = require("fs");
let content = fs.readFileSync("src/app/actions/project.actions.ts", "utf8");
content = content.replace(
  /stages: \{ orderBy: \{ order: "asc" \} \},/,
  `stages: { orderBy: { order: "asc" }, include: { tasks: { orderBy: { order: "asc" } } } },`
);
fs.writeFileSync("src/app/actions/project.actions.ts", content);

