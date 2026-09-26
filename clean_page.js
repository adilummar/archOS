
const fs = require("fs");
let content = fs.readFileSync("src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx", "utf-8");

content = content.replace(
  /import \{ NewTaskDrawer \} from "@\/components\/drawers\/NewTaskDrawer";\s*import \{ Plus \} from "lucide-react";\s*import \{ NewTaskDrawer \} from "@\/components\/drawers\/NewTaskDrawer";\s*import \{ Plus \} from "lucide-react";/g,
  `import { NewTaskDrawer } from "@/components/drawers/NewTaskDrawer";\nimport { Plus } from "lucide-react";`
);

content = content.replace(
  /const \[isNewTaskOpen, setIsNewTaskOpen\] = useState\(false\);\s*const \[isNewTaskOpen, setIsNewTaskOpen\] = useState\(false\);/g,
  `const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);`
);

fs.writeFileSync("src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx", content);
console.log("Cleaned page.tsx");

