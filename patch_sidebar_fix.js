const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

c = c.replace(
  /return \(\s*\{\/\* Mobile backdrop \*\/\}/,
  'return (\n    <>\n      {/* Mobile backdrop */}'
);

c = c.replace(
  /<\/aside>\s*\);\s*\}/,
  '</aside>\n    </>\n  );\n}'
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
