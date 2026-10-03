const fs = require('fs');

let file2 = 'src/components/project/TasksTab.tsx';
let content2 = fs.readFileSync(file2, 'utf-8');
content2 = content2.replace(/export function TasksTab[\s\S]*?const updateTaskMut = useUpdateTask\(project\.firmId, user\?\.id \|\| ""\);/,
`export function TasksTab({ project }: Props) {
  const { users } = useFirmStore();
  const { user } = useAuthStore();
  const { data: tasks = [] } = useTasks(project.firmId);
  const updateTaskMut = useUpdateTask(project.firmId, user?.id || "");`);
fs.writeFileSync(file2, content2);
