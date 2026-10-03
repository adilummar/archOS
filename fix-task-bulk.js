const fs = require('fs');

const files = [
  'src/app/[firmSlug]/(app)/attendance/page.tsx',
  'src/app/[firmSlug]/(app)/dashboard/page.tsx',
  'src/app/[firmSlug]/(app)/projects/page.tsx',
  'src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx',
  'src/app/[firmSlug]/(app)/staff/page.tsx',
  'src/components/shared/CommandPalette.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace import
  if (!content.includes('useTasks')) {
    content = content.replace('import { useTaskStore', 'import { useTasks } from "@/hooks/useTasks";\nimport { useTaskStore');
  }
  
  // Replace const { tasks } = useTaskStore()
  content = content.replace(/const \{ tasks \} = useTaskStore\(\);/g, 'const { data: tasks = [] } = useTasks(firm?.id || firmId || "");');
  
  fs.writeFileSync(file, content);
}
