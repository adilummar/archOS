const fs = require('fs');
let p = fs.readFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', 'utf8');

// Remove all occurrences of our import except one
p = p.replace(/import \{ useTasks, useUpdateTask \} from "@\/hooks\/useTasks";\n/g, '');
p = p.replace(
  'import { useTaskStore, projectCompletion } from "@/lib/store/task.store";',
  'import { useTaskStore, projectCompletion } from "@/lib/store/task.store";\nimport { useTasks, useUpdateTask } from "@/hooks/useTasks";'
);

fs.writeFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', p);
