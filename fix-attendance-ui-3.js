const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/attendance/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The type Session
content = content.replace(/type Session = Awaited<ReturnType<typeof getTodaySession>>;\n/g, 'type Session = any;\n');

// Missing muts & session definition
content = content.replace(/const \[session, setSession\] = useState<Session \| null>\(null\);\n/g, 'const { data: session, isLoading: sessionLoading } = useMyAttendance(firm?.id || "", user?.id || "");\n  const muts = useAttendanceMutations(firm?.id || "", user?.id || "");\n');

content = content.replace(/const \[loading, setLoading\] = useState\(true\);\n/g, 'const loading = sessionLoading;\n');

// The load block is STILL there
content = content.replace(/const load = useCallback\(async \(\) => \{[\s\S]*?\}, \[user, firm\]\);\n/g, '');

// getTasksByUser remnant? Let's catch whatever it is: `const userTasks = await getTasksByUser(user.id, firm?.id ?? "", user.email);`
// If we just remove it:
content = content.replace(/const userTasks = await getTasksByUser[\s\S]*?setMyTasks\(userTasks\);\n/g, '');

// `s.totalWorkMinutes` in checkOut success message:
content = content.replace(/s\.totalWorkMinutes/g, 'session.totalWorkMinutes');

fs.writeFileSync(file, content);
