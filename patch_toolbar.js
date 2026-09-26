
const fs = require("fs");
let content = fs.readFileSync("src/components/project/TasksTab.tsx", "utf-8");

const target = `      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {/* View toggle */}`;

const replacement = `      {/* Toolbar */}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* View toggle */}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  console.log("Replaced target 1");
} else {
  console.log("Could not find target 1");
}

const target2 = `        <div style={{ flex: 1 }} />

        {/* Total */}
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          {filteredTasks.length} tasks
        </span>
      </div>`;

const replacement2 = `        <div style={{ flex: 1 }} />

        {/* Total */}
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
      </div>`;

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log("Replaced target 2");
} else {
  console.log("Could not find target 2");
}

const target3 = `      {/* List view */}`;
const replacement3 = `      {isNewTaskOpen && (
        <NewTaskDrawer
          open={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          projectId={project.id}
        />
      )}

      {/* List view */}`;
if (content.includes(target3)) {
  content = content.replace(target3, replacement3);
  console.log("Replaced target 3");
} else {
  console.log("Could not find target 3");
}

fs.writeFileSync("src/components/project/TasksTab.tsx", content);

