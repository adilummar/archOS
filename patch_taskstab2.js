
const fs = require("fs");
let content = fs.readFileSync("src/components/project/TasksTab.tsx", "utf-8");

content = content.replace(
  /\{\/\*\s*Toolbar\s*\*\/\}\s*<div\s*style=\{\{\s*display:\s*"flex",\s*alignItems:\s*"center",\s*gap:\s*10,\s*marginBottom:\s*16,\s*flexWrap:\s*"wrap",\s*\}\}\s*>/,
  `{/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 32,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >`
);

fs.writeFileSync("src/components/project/TasksTab.tsx", content);
console.log("Patched TasksTab.tsx");

