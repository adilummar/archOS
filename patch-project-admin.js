const fs = require('fs');

const file = 'src/services/project.service.ts';
let content = fs.readFileSync(file, 'utf-8');

// For createProject
content = content.replace(
  /export async function createProject\([\s\S]*?\}\) \{([\s\n]*)return withAuthTx/m,
  (match, p1) => match.replace('return withAuthTx', `if (ctx.role !== 'admin') throw new Error('Unauthorized: Only Admin can create projects');\n  return withAuthTx`)
);

// For instantiateProjectFromTemplate
content = content.replace(
  /export async function instantiateProjectFromTemplate\([\s\S]*?\}\) \{([\s\n]*)return withAuthTx/m,
  (match, p1) => match.replace('return withAuthTx', `if (ctx.role !== 'admin') throw new Error('Unauthorized: Only Admin can create projects');\n  return withAuthTx`)
);

fs.writeFileSync(file, content);
console.log('Patched project.service.ts for ADMIN ONLY');
