const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/tasks/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const checkImplicit = \(t: Task\) => \{[\s\S]*?return false;\s*\};/;
const replacement = `const checkImplicit = (t: Task) => {
      if (t.assigneeId === user.id) return true;
      return false;
    };`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed implicit check in TasksPage with regex");
} else {
  console.log("Regex did not match in TasksPage");
}
