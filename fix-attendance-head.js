const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/attendance/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(/export default function AttendancePage\(\) \{[\s\S]*?const load = useCallback\(async \(\) => \{/g, 
`export default function AttendancePage() {
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { data: tasks = [] } = useTasks(firm?.id || "");
  const { data: session, isLoading: loading } = useMyAttendance(firm?.id || "", user?.id || "");
  const { data: history = [] } = useAttendanceHistory(firm?.id || "", user?.id || "");
  const { data: taskBreakdown = [] } = useTaskTimeBreakdown(session?.id || "");
  const muts = useAttendanceMutations(firm?.id || "", user?.id || "");

  const [submitting, setSubmitting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [switchProjectId, setSwitchProjectId] = useState<string>("");
  const [switchTaskId, setSwitchTaskId] = useState<string>("");

  const load = useCallback(async () => {`);

// Now manually slice out `load` and `useEffect(() => { load() }, [load])`
// We can just empty `load` function body.
content = content.replace(/const load = useCallback\(async \(\) => \{[\s\S]*?\}, \[user, firm\]\);\n/g, '');

content = content.replace(/useEffect\(\(\) => \{\n\s*load\(\);\n\s*\}, \[load\]\);\n/g, '');

// getTodaySession remnant is inside `load`, which will be removed if regex matches. Let's make sure load matches exactly
content = content.replace(/const load = useCallback\(async \(\) => \{[\s\S]*?setLoading\(false\);\n\s*\}\n\s*\}, \[user, firm\]\);\n\n\s*useEffect\(\(\) => \{\n\s*load\(\);\n\s*\}, \[load\]\);/g, '');

fs.writeFileSync(file, content);
