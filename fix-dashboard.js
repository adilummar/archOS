const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Replace imports
content = content.replace(/import \{ useProjectStore \} from "@\/lib\/store\/project\.store";\n/g, 'import { useProjects } from "@/hooks/useProjects";\n');
content = content.replace(/import \{ useFirmStore \} from "@\/lib\/store\/firm\.store";\n/g, 'import { useStaff } from "@/hooks/useStaff";\n');

// Replace hook usages
content = content.replace(/const \{ users \} = useFirmStore\(\);\n/g, 'const { data: users = [] } = useStaff(firm?.id || "");\n');
content = content.replace(/const \{ projects \} = useProjectStore\(\);\n/g, 'const { data: projects = [] } = useProjects(firm?.id || "");\n');

// Dashboard might also consume useMyAttendance now if it showed attendance! Let's check if there's any attendance state.
// If not, this is enough.

fs.writeFileSync(file, content);
