const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update PrimaryButton types to accept title
content = content.replace(
  '  iconOnly?: boolean;\n}) {',
  '  iconOnly?: boolean;\n  title?: string;\n}) {'
);
content = content.replace(
  '  iconOnly = false,\n}: {',
  '  iconOnly = false,\n  title,\n}: {'
);
content = content.replace(
  '<button\n      onClick={onClick}',
  '<button\n      title={title}\n      onClick={onClick}'
);

// Add titles to the StaffRow buttons
content = content.replace(/iconOnly\s*>\s*Save/g, 'iconOnly title="Save">Save');
content = content.replace(/iconOnly\s*>\s*Pass/g, 'iconOnly title="Change Password">Pass');
content = content.replace(/iconOnly\s*>\s*Edit/g, 'iconOnly title="Edit Staff">Edit');
content = content.replace(/iconOnly\s*>\s*Discontinue/g, 'iconOnly title="Discontinue Staff">Discontinue');
content = content.replace(/iconOnly\s*>\s*Reactivate/g, 'iconOnly title="Reactivate Staff">Reactivate');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Added titles to buttons");
