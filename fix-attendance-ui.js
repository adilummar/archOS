const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/attendance/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Add import
if (!content.includes('useMyAttendance')) {
  content = content.replace('import { useTasks } from "@/hooks/useTasks";', 'import { useTasks } from "@/hooks/useTasks";\nimport { useMyAttendance, useAttendanceMutations } from "@/hooks/useAttendance";');
}

// Remove server actions import
content = content.replace(/import \{\n\s*getTodaySession,\n\s*checkIn,\n\s*switchTask,\n\s*takeBreak,\n\s*resumeWork,\n\s*checkOut,\n\s*getAttendanceHistory,\n\s*getTaskTimeBreakdown,\n\s*\} from "@\/app\/actions\/attendance\.actions";\n/g, 'import { getAttendanceHistory, getTaskTimeBreakdown } from "@/app/actions/attendance.actions";\n');

// Replace state
content = content.replace(/const \[session, setSession\] = useState<any>\(null\);\n\s*const \[loading, setLoading\] = useState\(true\);\n/g, 'const { data: session, isLoading: loading } = useMyAttendance(firm?.id || "", user?.id || "");\n  const muts = useAttendanceMutations(firm?.id || "", user?.id || "");\n');

// Remove fetchSession effect
content = content.replace(/useEffect\(\(\) => \{\n\s*const fetchSession = async \(\) => \{\n[\s\S]*?\}\s*fetchSession\(\);\n\s*\}, \[user, firm\]\);\n/g, '');

// Replace mutations
content = content.replace(/const s = await checkIn\(/g, 'await muts.checkIn.mutateAsync(');
content = content.replace(/const s = await switchTask\(\{[\s\S]*?\}\);/g, 'await muts.switchTask.mutateAsync({ sessionId: session.id, projectId: selectedProjectId, taskId: selectedTaskId });');
content = content.replace(/const s = await takeBreak\(session.id\);/g, 'await muts.startBreak.mutateAsync({ sessionId: session.id, type: "coffee" });');
content = content.replace(/const s = await resumeWork\(session.id\);/g, 'await muts.endBreak.mutateAsync({ sessionId: session.id });');
content = content.replace(/const s = await checkOut\(session.id\);/g, 'await muts.checkOut.mutateAsync({ sessionId: session.id });');

// Replace setSession(s) because TanStack Query refetches automatically
content = content.replace(/setSession\(s\);\n/g, '');

// There are places where breakdown is fetched immediately after checkOut etc., it might use 's.id'. Change to 'session.id'
content = content.replace(/getTaskTimeBreakdown\(s.id\)/g, 'getTaskTimeBreakdown(session.id)');

fs.writeFileSync(file, content);
