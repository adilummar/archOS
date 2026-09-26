
const fs = require("fs");
let content = fs.readFileSync("src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx", "utf-8");

// Import NewStageDrawer
if (!content.includes("NewStageDrawer")) {
  content = content.replace(
    /import \{ NewTaskDrawer \} from "@\/components\/drawers\/NewTaskDrawer";/,
    `import { NewTaskDrawer } from "@/components/drawers/NewTaskDrawer";\nimport { NewStageDrawer } from "@/components/drawers/NewStageDrawer";\nimport { Target } from "lucide-react";`
  );
}

// Add state
if (!content.includes("isNewMilestoneOpen")) {
  content = content.replace(
    /const \[isNewTaskOpen, setIsNewTaskOpen\] = useState\(false\);/,
    `const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);\n  const [isNewMilestoneOpen, setIsNewMilestoneOpen] = useState(false);`
  );
}

// Add the button
if (!content.includes("New Milestone")) {
  const targetBtn = `<Plus size={14} strokeWidth={2} /> New Task
            </button>
          )}`;
  
  const replacementBtn = `<Plus size={14} strokeWidth={2} /> New Task
            </button>
          )}
          
          {/* Milestone button */}
          {activeTab === "overview" && (
            <button
              onClick={() => setIsNewMilestoneOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "var(--color-bg-input)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginLeft: 16,
              }}
            >
              <Target size={14} strokeWidth={2} /> New Milestone
            </button>
          )}`;
          
  content = content.replace(targetBtn, replacementBtn);
}

// Render the drawer
if (!content.includes("<NewStageDrawer")) {
  const targetRender = `{isNewTaskOpen && (
        <NewTaskDrawer
          open={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          projectId={project.id}
        />
      )}`;
      
  const replacementRender = `{isNewTaskOpen && (
        <NewTaskDrawer
          open={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          projectId={project.id}
        />
      )}

      {isNewMilestoneOpen && (
        <NewStageDrawer
          open={isNewMilestoneOpen}
          onClose={() => setIsNewMilestoneOpen(false)}
          projectId={project.id}
        />
      )}`;
      
  content = content.replace(targetRender, replacementRender);
}

fs.writeFileSync("src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx", content);
console.log("Patched milestone in page.tsx");

