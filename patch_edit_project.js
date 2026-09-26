
const fs = require("fs");
let content = fs.readFileSync("src/components/project/EditProjectDrawer.tsx", "utf-8");

// Imports
content = content.replace(
  `import { updateProject } from "@/app/actions/project.actions";`,
  `import { updateProject, updateProjectTemplate } from "@/app/actions/project.actions";`
);

// Add templates to useFirmStore hook
content = content.replace(
  `const { users, clients } = useFirmStore();`,
  `const { users, clients, templates } = useFirmStore();`
);

// Add templateId to state
const stateTarget = `const [name, setName] = useState(project.name);`;
const stateReplacement = `const [name, setName] = useState(project.name);
  const [templateId, setTemplateId] = useState(project.templateId || "");`;
content = content.replace(stateTarget, stateReplacement);

// Add firmTemplates
const templatesTarget = `const firmClients = useMemo(
    () => clients.filter((c) => c.firmId === firm?.id),
    [clients, firm]
  );`;
const templatesReplacement = `const firmClients = useMemo(
    () => clients.filter((c) => c.firmId === firm?.id),
    [clients, firm]
  );
  const firmTemplates = useMemo(
    () => templates.filter((t) => t.firmId === firm?.id),
    [templates, firm]
  );`;
content = content.replace(templatesTarget, templatesReplacement);

// Update handleSubmit to check for template change
const submitTarget = `    try {
      await updateProject(project.id, {
        name: name.trim(),`;
const submitReplacement = `    try {
      if (templateId !== (project.templateId || "")) {
        const confirmed = confirm("WARNING: Changing the template will permanently delete all existing tasks and stages in this project, and replace them with the new template. Are you sure you want to proceed?");
        if (!confirmed) {
          setIsSubmitting(false);
          return;
        }
        await updateProjectTemplate(firm.id, project.id, templateId, user.id);
      }

      await updateProject(project.id, {
        name: name.trim(),`;
content = content.replace(submitTarget, submitReplacement);

// Add UI for template selection
const uiTarget = `          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
              Project Name
            </label>`;
const uiReplacement = `          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
              Project Template (WARNING: Changing wipes existing tasks)
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={inputStyle}
            >
              <option value="">No Template</option>
              {firmTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6 }}>
              Project Name
            </label>`;
content = content.replace(uiTarget, uiReplacement);

fs.writeFileSync("src/components/project/EditProjectDrawer.tsx", content);
console.log("Patched EditProjectDrawer.tsx");

