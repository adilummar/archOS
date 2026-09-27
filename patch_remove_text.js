const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Make children optional in PrimaryButton
content = content.replace(
  '  children: React.ReactNode;',
  '  children?: React.ReactNode;'
);

// 2. Remove the text from the action buttons in StaffRow
content = content.replace(/iconOnly title="Save">Save/g, 'iconOnly title="Save"></PrimaryButton>');
content = content.replace(/iconOnly title="Change Password">Pass/g, 'iconOnly title="Change Password"></PrimaryButton>');
content = content.replace(/iconOnly title="Edit Staff">Edit/g, 'iconOnly title="Edit Staff"></PrimaryButton>');
content = content.replace(/iconOnly title="Discontinue Staff">Discontinue/g, 'iconOnly title="Discontinue Staff"></PrimaryButton>');
content = content.replace(/iconOnly title="Reactivate Staff">Reactivate/g, 'iconOnly title="Reactivate Staff"></PrimaryButton>');

// Remove the closing tags that we just duplicated
content = content.replace(/<\/PrimaryButton>\s*<\/PrimaryButton>/g, '</PrimaryButton>');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Removed text from StaffRow buttons");
