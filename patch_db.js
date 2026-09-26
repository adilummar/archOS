
const fs = require("fs");
let content = fs.readFileSync("src/components/providers/DBProvider.tsx", "utf8");
content = content.replace(
  /drawingTypesExpected: s\.drawingTypesExpected as FileCategory\[\],/,
  `drawingTypesExpected: s.drawingTypesExpected as FileCategory[],\n            tasks: s.tasks ? s.tasks.map(t => ({ id: t.id, stageId: t.stageId, title: t.title, description: t.description ?? "", order: t.order, priority: t.priority })) : [],`
);
fs.writeFileSync("src/components/providers/DBProvider.tsx", content);

