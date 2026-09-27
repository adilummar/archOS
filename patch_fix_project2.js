const fs = require('fs');
const filePath = 'src/services/project.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\}\);\s*\}\);\s*\}\);\s*\}\);\s*\}/g;
const replacement = `    });\n  });\n}`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed syntax error in project.service.ts with generic regex");
} else {
  console.log("Regex didn't match getProjects bottom closures");
}
