const fs = require('fs');

const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'import { Key, Edit2 } from "lucide-react";',
  'import { Key } from "lucide-react";'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Removed duplicate Edit2 import");
