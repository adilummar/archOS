const fs = require('fs');
let c = fs.readFileSync('src/components/drawers/TaskDrawer.tsx', 'utf8');

c = c.replace(
  'import { useAuthStore } from "../../lib/store/auth.store";',
  'import { useAuthStore } from "../../lib/store/auth.store";\nimport { useUpdateTask, useDeleteTask, useReviewTask, useOverrideTask, useAddSubtask, useToggleSubtask } from "@/hooks/useTasks";'
);

fs.writeFileSync('src/components/drawers/TaskDrawer.tsx', c);
