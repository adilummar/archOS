const fs = require('fs');
const filePath = 'src/components/providers/DBProvider.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /if \(user\) \{([\s\S]*?)\}\s*\}/m;
content = content.replace(regex, `if (user) {$1} else {\n            window.location.href = '/' + firmSlug + '/login';\n          }\n        } else {\n          window.location.href = '/' + firmSlug + '/login';\n        }`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched DBProvider");
