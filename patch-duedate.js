const fs = require('fs');

const file = 'src/services/task.service.ts';
let content = fs.readFileSync(file, 'utf-8');

// Fix 1: dueDate validation
content = content.replace(
  /const parsedDueDate = toDateTime\(dueDate\);\s*if \(\!parsedDueDate\) throw new Error\('Invalid due date'\);/,
  `let parsedDueDate = null;
    if (dueDate) {
      parsedDueDate = toDateTime(dueDate);
      if (!parsedDueDate) throw new Error('Invalid due date');
    }`
);

// Fix 2: Minimum lead time validation only if parsedDueDate exists
content = content.replace(
  /const diffMs = parsedDueDate\.getTime\(\) - Date\.now\(\);/g,
  `const diffMs = (parsedDueDate || new Date()).getTime() - Date.now();`
);

content = content.replace(
  /if \(firm && firm\.minimumTaskLeadTimeDays > 0\) \{/,
  `if (parsedDueDate && firm && firm.minimumTaskLeadTimeDays > 0) {`
);

fs.writeFileSync(file, content);
console.log('Patched parsedDueDate check');
