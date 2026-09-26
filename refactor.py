import re

with open('src/components/drawers/NewTaskDrawer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace imports
c = re.sub(r'import \{ createTask, assignTaskWithOverride \} from "@/app/actions/task\.actions";', 'import { useCreateTask, useOverrideTask } from "@/hooks/useTasks";', c)
c = re.sub(r'import \{ useTaskStore \} from "@/lib/store/task\.store";\n', '', c)

# Inject hooks
c = re.sub(
    r'(const \{ user, firm \} = useAuthStore\(\);)',
    r'\1\n  const createTaskMut = useCreateTask(firm?.id || "");\n  const overrideTaskMut = useOverrideTask(firm?.id || "");',
    c
)

# Replace createTask action with mutateAsync
c = re.sub(r'const newTask = await createTask\(\{', 'const newTask = await createTaskMut.mutateAsync({', c)

# Replace assignTaskWithOverride action with mutateAsync
c = re.sub(
    r'await assignTaskWithOverride\(\{([\s\S]*?)reason: overrideReason \}\);',
    r'await overrideTaskMut.mutateAsync({ taskId: newTask.id, data: {\1reason: overrideReason } });',
    c
)

with open('src/components/drawers/NewTaskDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
