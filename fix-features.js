const fs = require('fs');

const files = [
  'src/app/actions/project.actions.ts',
  'src/app/actions/task.actions.ts',
  'src/app/actions/user.actions.ts',
  'src/app/api/v1/projects/route.ts',
  'src/app/api/v1/projects/instantiate/route.ts',
  'src/app/api/v1/projects/[projectId]/route.ts',
  'src/app/api/v1/tasks/route.ts',
  'src/app/api/v1/tasks/[taskId]/route.ts',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/import \{.*?requireFeature.*?\} from "@\/services\/auth\.service";/, 'import { getAuthContext } from "@/services/auth.service";\nimport { requireFeature } from "@/services/feature.service";');
  content = content.replace(/import \{ requireFeature \} from "@\/services\/auth\.service";/, 'import { requireFeature } from "@/services/feature.service";');
  content = content.replace(/requireFeature\(/g, 'await requireFeature(');
  
  // Clean up dup imports if they were introduced
  if (content.includes('import { getAuthContext } from "@/services/auth.service";\nimport { getAuthContext } from "@/services/auth.service";')) {
      content = content.replace('import { getAuthContext } from "@/services/auth.service";\nimport { getAuthContext } from "@/services/auth.service";', 'import { getAuthContext } from "@/services/auth.service";');
  }
  
  fs.writeFileSync(file, content);
}
