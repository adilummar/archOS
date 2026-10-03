const fs = require('fs');

let content = fs.readFileSync('src/hooks/useProjects.ts', 'utf-8');

// Replace any[] with Project[]
content = content.replace(/api\.get<any\[\]>\('\/api\/v1\/projects'/g, "api.get<Project[]>('/api/v1/projects'");
// Replace any with Project for useProject
content = content.replace(/api\.get<any>\(`\/api\/v1\/projects\/\$\{projectId\}`/g, "api.get<Project>(`/api/v1/projects/${projectId}`");
// Add import Project
if (!content.includes('import type { Project }')) {
  content = content.replace("import { api }", "import { api } from '@/lib/api-client';\nimport type { Project } from '@/lib/store/types';");
}

fs.writeFileSync('src/hooks/useProjects.ts', content);

let content2 = fs.readFileSync('src/hooks/useTasks.ts', 'utf-8');
content2 = content2.replace(/api\.get<any\[\]>\('/g, "api.get<Task[]>('/");
content2 = content2.replace(/api\.get<any>\('/g, "api.get<Task>('/");
if (!content2.includes('import type { Task }')) {
  content2 = content2.replace("import { api }", "import { api } from '@/lib/api-client';\nimport type { Task } from '@/lib/store/types';");
}
fs.writeFileSync('src/hooks/useTasks.ts', content2);
