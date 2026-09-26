
const fs = require("fs");
let content = fs.readFileSync("src/app/actions/task.actions.ts", "utf-8");

content = content.replace(
  /export async function createTask\(data: \{\s*firmId: string;\s*projectId: string;\s*stageId\?: string;\s*assigneeId: string;\s*assignerId: string;\s*title: string;\s*description\?: string;\s*priority\?: string;\s*dueDate\?: Date;\s*startDate\?: Date;\s*tags\?: string\[\];\s*\}\) \{/,
  `export async function createTask(data: {
  firmId: string;
  projectId: string;
  stageId?: string;
  assigneeId: string;
  assignerId: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  startDate?: Date;
  tags?: string[];
}) {
  console.log("createTask called with data:", data);`
);

fs.writeFileSync("src/app/actions/task.actions.ts", content);
console.log("Patched task.actions.ts");

