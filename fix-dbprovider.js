const fs = require('fs');

const file = 'src/components/providers/DBProvider.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Replace Promise.all
content = content.replace(/const \[staff, projects, dbTasks, dbTemplates\] = await Promise\.all\(\[\n\s*getStaffByFirm\(firm\.id\),\n\s*getProjectsByFirm\(firm\.id\),\n\s*getAllTasksByFirm\(firm\.id\),\n\s*getTemplatesByFirm\(firm\.id\),\n\s*\]\);\n/g, '');

// Hydrate firm store: remove staff
content = content.replace(/users: staff\.map\(\(s\) => \(\{[\s\S]*?\}\)\),\n/g, 'users: [],\n');

// Hydrate project store
content = content.replace(/\/\/ â”€â”€ Hydrate project store â”€â”€[\s\S]*?useProjectStore\.setState\(\(projectState\) => \{[\s\S]*?\}\);\n/g, '');

// Hydrate task store
content = content.replace(/\/\/ â”€â”€ Hydrate task store â”€â”€[\s\S]*?useTaskStore\.setState\(\(taskState\) => \{[\s\S]*?\}\);\n/g, '');

// Remove the import for them
content = content.replace(/import \{ getFirmBySlug, getStaffByFirm, getProjectsByFirm \} from "@\/app\/actions\/bootstrap\.actions";/g, 'import { getFirmBySlug } from "@/app/actions/bootstrap.actions";');
content = content.replace(/import \{ getAllTasksByFirm \} from "@\/app\/actions\/task\.actions";\n/g, '');
content = content.replace(/import \{ getTemplatesByFirm \} from "@\/app\/actions\/project\.actions";\n/g, '');

fs.writeFileSync(file, content);
