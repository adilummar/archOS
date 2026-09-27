const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update PrimaryButton types
content = content.replace(
  '  disabled?: boolean;\n}) {',
  '  disabled?: boolean;\n  iconOnly?: boolean;\n}) {'
);
content = content.replace(
  '  disabled = false,\n}: {',
  '  disabled = false,\n  iconOnly = false,\n}: {'
);

// Update PrimaryButton padding and children
content = content.replace(
  /padding: "7px 14px",/g,
  'padding: iconOnly ? "7px" : "7px 14px",'
);
content = content.replace(
  '{icon}\n        {children}\n      </button>',
  '{icon}\n        {!iconOnly && children}\n      </button>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched PrimaryButton");
