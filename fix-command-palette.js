const fs = require('fs');

const file = 'src/components/shared/CommandPalette.tsx';
let content = fs.readFileSync(file, 'utf-8');

// Replace imports
content = content.replace(/import \{ useProjectStore \} from "\.\.\/\.\.\/lib\/store\/project\.store";\n/g, 'import { useProjects } from "@/hooks/useProjects";\n');
content = content.replace(/import \{ useTasks \} from "@\/hooks\/useTasks";\n/g, 'import { useTasks } from "@/hooks/useTasks";\nimport { useStaff } from "@/hooks/useStaff";\n');

// Replace hook usages
content = content.replace(/const \{ projects \} = useProjectStore\(\);\n/g, 'const { data: projects = [] } = useProjects(firm?.id || "");\n');

// We need to keep clients and contractors from useFirmStore
content = content.replace(/const \{ users, clients, contractors \} = useFirmStore\(\);\n/g, 'const { clients, contractors } = useFirmStore();\n  const { data: users = [] } = useStaff(firm?.id || "");\n');

fs.writeFileSync(file, content);
