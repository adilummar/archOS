
const fs = require("fs");
let content = fs.readFileSync("src/components/project/TasksTab.tsx", "utf-8");

// We will use regex to find the blocks regardless of whitespace/newlines.
content = content.replace(
  /\{\/\*\s*Toolbar\s*\*\/\}\s*<div\s*style=\{\{\s*display:\s*"flex",\s*alignItems:\s*"center",\s*gap:\s*10,\s*marginBottom:\s*16,\s*flexWrap:\s*"wrap",\s*\}\}\s*>/,
  `{/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>`
);

content = content.replace(
  /\{\/\*\s*Total\s*\*\/\}\s*<span[^>]*>\s*\{filteredTasks\.length\}\s*tasks\s*<\/span>\s*<\/div>/,
  `{/* Total */}
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          {filteredTasks.length} tasks
        </span>
        </div>
      </div>
      
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={() => setIsNewTaskOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--color-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          <Plus size={14} strokeWidth={2} /> New Task
        </button>
      </div>`
);

fs.writeFileSync("src/components/project/TasksTab.tsx", content);
console.log("Patched with regex");

