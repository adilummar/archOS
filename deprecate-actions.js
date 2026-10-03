const fs = require('fs');

let content = fs.readFileSync('src/app/actions/project.actions.ts', 'utf-8');

const functionsToDeprecate = [
  'createProject',
  'updateProject',
  'instantiateProjectFromTemplate',
  'createClient',
  'getProjects',
  'getProject'
];

for (const fn of functionsToDeprecate) {
  const regex = new RegExp(`export async function ${fn}\\(`, 'g');
  content = content.replace(regex, `/** @deprecated Migrated to TanStack Query API: /api/v1/projects */\nexport async function ${fn}(`);
}

fs.writeFileSync('src/app/actions/project.actions.ts', content);
