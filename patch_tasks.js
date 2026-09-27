const fs = require('fs');
let content = fs.readFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', 'utf8');

// 1. Add useSearchParams
content = content.replace('useParams, useRouter }', 'useParams, useRouter, useSearchParams }');

// 2. Add quickFilter state
content = content.replace(
  'const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);',
  `const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);\n  const [quickFilter, setQuickFilter] = useState<"all" | "overdue" | "priority" | "review">("all");\n  const searchParams = useSearchParams();\n  useEffect(() => {\n    const q = searchParams?.get("filter");\n    if (q === "overdue" || q === "priority" || q === "review") setQuickFilter(q);\n  }, [searchParams]);`
);

// 3. Add quickFilter to dependencies
content = content.replace(
  '[tasks, firm, user, statusFilter, priorityFilter, projectFilter, search, showMyTasksOnly]',
  '[tasks, firm, user, statusFilter, priorityFilter, projectFilter, search, showMyTasksOnly, quickFilter]'
);

// 4. Implement quickFilter logic in useMemo
const filterLogic = `
    if (quickFilter === "overdue") {
      result = result.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !["done", "approved"].includes(t.status));
    } else if (quickFilter === "priority") {
      result = result.filter(t => t.priority === "high");
    } else if (quickFilter === "review") {
      result = result.filter(t => t.status === "review");
    }
`;
content = content.replace(
  'if (statusFilter !== "all") {',
  filterLogic + '\n    if (statusFilter !== "all") {'
);

fs.writeFileSync('src/app/[firmSlug]/(app)/tasks/page.tsx', content);
