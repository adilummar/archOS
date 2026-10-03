const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/projects/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(/const { data: projects = \[\] } = useProjects\(firm\?\.id \|\| ""\);/, 'const { data: projects = [], isLoading } = useProjects(firm?.id || "");');
content = content.replace(/const \[loading, setLoading\] = useState\(true\);\n/g, '');
content = content.replace(/useEffect\(\(\) => {\n\s*const t = setTimeout\(\(\) => setLoading\(false\), 1000\);\n\s*return \(\) => clearTimeout\(t\);\n\s*}, \[\]\);\n/g, '');

content = content.replace(/loading \? \(/, 'isLoading ? (');

fs.writeFileSync(file, content);
