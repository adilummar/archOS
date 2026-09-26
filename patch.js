
const fs = require("fs");
let content = fs.readFileSync("src/components/project/TasksTab.tsx", "utf-8");

const target1 = `    <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >`;

const replacement1 = `    <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>`;

content = content.replace(target1, replacement1);

const target2 = `        ]}
        />
`;

const replacement2 = `        ]}
        />
        </div>
        
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
`;
content = content.replace(target2, replacement2);

const target3 = `      {/* List view */}`;

const replacement3 = `      {isNewTaskOpen && (
        <NewTaskDrawer
          open={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          projectId={project.id}
        />
      )}

      {/* List view */}`;
content = content.replace(target3, replacement3);

fs.writeFileSync("src/components/project/TasksTab.tsx", content);
console.log("Patched TasksTab.tsx");

