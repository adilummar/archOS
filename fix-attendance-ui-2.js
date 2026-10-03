const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/attendance/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Ensure import has new hooks
content = content.replace(/import \{ useMyAttendance, useAttendanceMutations \} from "@\/hooks\/useAttendance";/, 'import { useMyAttendance, useAttendanceHistory, useTaskTimeBreakdown, useAttendanceMutations } from "@/hooks/useAttendance";');

// Remove remaining server action imports for attendance
content = content.replace(/import \{ getAttendanceHistory, getTaskTimeBreakdown \} from "@\/app\/actions\/attendance\.actions";\n/g, '');

// Replace History type definition if it uses Server Action
content = content.replace(/type History = Awaited<ReturnType<typeof getAttendanceHistory>>;\n/g, 'type History = any[];\n');

// Replace history state with hook
content = content.replace(/const \[history, setHistory\] = useState<History>\(\[\]\);\n/g, 'const { data: history = [] } = useAttendanceHistory(firm?.id || "", user?.id || "");\n');

// Replace breakdown state with hook
content = content.replace(/const \[taskBreakdown, setTaskBreakdown\] = useState<any>\(\[\]\);\n/g, 'const { data: taskBreakdown = [] } = useTaskTimeBreakdown(session?.id || "");\n');

// Remove load effect entirely
content = content.replace(/const load = useCallback\(async \(\) => \{[\s\S]*?\}, \[user, firm\]\);\n/g, '');
content = content.replace(/useEffect\(\(\) => \{\n\s*load\(\);\n\s*\}, \[load\]\);\n/g, '');

// Replace manual setting of breakdown
content = content.replace(/const breakdown = await getTaskTimeBreakdown\(session.id\);\n\s*setTaskBreakdown\(breakdown\);\n/g, '');
content = content.replace(/const breakdown = await getTaskTimeBreakdown\(s.id\);\n\s*setTaskBreakdown\(breakdown\);\n/g, '');

// The load tasks is still there: `const userTasks = await getTasksByUser(user.id, firm?.id ?? "", user.email);`
// Let's replace getTasksByUser with a TanStack query. Wait, it already has `const { data: tasks = [] } = useTasks(firm?.id || "");`!
// So we can remove the state `myTasks`!
content = content.replace(/const \[myTasks, setMyTasks\] = useState<any>\(\[\]\);\n/g, '');
content = content.replace(/const userTasks = await getTasksByUser\([\s\S]*?\);\n\s*setMyTasks\(userTasks\);\n/g, '');
content = content.replace(/myTasks/g, 'tasks'); // Replace all usages of myTasks with tasks

// Remove getTasksByUser import
content = content.replace(/import \{ getTasksByUser \} from "@\/app\/actions\/task\.actions";\n/g, '');

fs.writeFileSync(file, content);
