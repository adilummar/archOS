const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '      {icon}\n      {children}\n    </button>',
  '      {icon}\n      {!iconOnly && children}\n    </button>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched PrimaryButton children");
