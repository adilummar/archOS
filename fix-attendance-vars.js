const fs = require('fs');
let file = 'src/app/[firmSlug]/(app)/attendance/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The component starts at `export default function AttendancePage() {`
const injection = `
  const dbTasks = tasks;
  const setDbTasks = () => {};
  const [markDone, setMarkDone] = useState(false);
  const firmProjects = projects;
  const tasksForProject = selectedProjectId ? tasks.filter((t: any) => t.projectId === selectedProjectId) : [];
  const setLoading = (v: boolean) => {};
`;

content = content.replace(/export default function AttendancePage\(\) \{[\s\S]*?const \[submitting, setSubmitting\] = useState\(false\);/, 
  `export default function AttendancePage() {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { data: tasks = [] } = useTasks(firm?.id || "");
  const { data: session, isLoading: sessionLoading } = useMyAttendance(firm?.id || "", user?.id || "");
  const { data: history = [] } = useAttendanceHistory(firm?.id || "", user?.id || "");
  const { data: taskBreakdown = [] } = useTaskTimeBreakdown(session?.id || "");
  const muts = useAttendanceMutations(firm?.id || "", user?.id || "");
  const loading = sessionLoading;
  ${injection}
  const [submitting, setSubmitting] = useState(false);`
);

// We need to also clean up the load function completely because it's still containing getTodaySession
content = content.replace(/const load = useCallback\(async \(\) => \{[\s\S]*?\}, \[user, firm\]\);\n/g, '');
content = content.replace(/useEffect\(\(\) => \{\n\s*load\(\);\n\s*\}, \[load\]\);\n/g, '');

fs.writeFileSync(file, content);
