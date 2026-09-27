const fs = require('fs');
const filePath = 'src/services/project.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  '        });\n      });\n    });\n  });\n}\n\n// ─── GET a single project',
  '        });\n  });\n}\n\n// ─── GET a single project'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed syntax error in project.service.ts");
