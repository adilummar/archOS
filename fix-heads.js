const fs = require('fs');

let file1 = 'src/components/drawers/TaskDrawer.tsx';
let content1 = fs.readFileSync(file1, 'utf-8');
content1 = content1.replace(/export function TaskDrawer[\s\S]*?const firmId = authUser\?\.firmId \|\| "";/, 
`export function TaskDrawer({ taskId, onClose, readonly }: TaskDrawerProps) {
  const authUser = useAuthStore((s) => s.user);
  const firmId = authUser?.firmId || "";
  const { data: tasks = [] } = useTasks(firmId);
  const task = tasks.find((t) => t.id === taskId);
`);
fs.writeFileSync(file1, content1);

let file2 = 'src/components/project/TasksTab.tsx';
let content2 = fs.readFileSync(file2, 'utf-8');
content2 = content2.replace(/export function TasksTab[\s\S]*?const \{ user \} = useAuthStore\(\);/,
`export function TasksTab({ project }: Props) {
  const { users } = useFirmStore();
  const { user } = useAuthStore();
  const { data: tasks = [] } = useTasks(project.firmId);
  const updateTaskMut = useUpdateTask(project.firmId, user?.id || "");
`);
fs.writeFileSync(file2, content2);
