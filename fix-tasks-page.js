const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/tasks/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Replace useTaskStore for tasks
content = content.replace(/const \{ tasks, setTaskStatus \} = useTaskStore\(\);/, 'const { data: tasks = [], isLoading, error } = useTasks(firm?.id || "");\n  const updateTaskMut = useUpdateTask(firm?.id || "", user?.id || "");');

// Replace setTaskStatus
content = content.replace(/setTaskStatus\(sourceTask.id, targetColumn.id\);/g, 'updateTaskMut.mutateAsync({ taskId: sourceTask.id, data: { status: targetColumn.id } });');
content = content.replace(/setTaskStatus\(sourceTask.id, overTask.status\);/g, 'updateTaskMut.mutateAsync({ taskId: sourceTask.id, data: { status: overTask.status } });');

// Replace fake loading
content = content.replace(/const \[loading, setLoading\] = useState\(true\);\n/g, '');
content = content.replace(/useEffect\(\(\) => {\n\s*const t = setTimeout\(\(\) => setLoading\(false\), 800\);\n\s*return \(\) => clearTimeout\(t\);\n\s*}, \[\]\);\n/g, '');
content = content.replace(/loading \? \(/, 'isLoading ? (');

const errorBlock = `
  if (error) {
    const err = error as any;
    const msg = err.code === "FEATURE_DISABLED" ? "Feature not enabled for this firm" : err.message || "Failed to load tasks";
    return (
      <div style={{ padding: 20, color: "var(--color-destructive)" }}>
        <h3>Error Loading Tasks</h3>
        <p>{msg}</p>
      </div>
    );
  }
`;

content = content.replace(/if \(!firm \|\| !user\) return null;/, 'if (!firm || !user) return null;' + errorBlock);

fs.writeFileSync(file, content);
