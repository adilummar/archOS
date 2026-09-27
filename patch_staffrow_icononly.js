const fs = require('fs');
const filePath = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The action buttons are inside StaffRow, which we can find by variant="ghost" or size={12}
// Wait, we need to add iconOnly to the 3/4 buttons in StaffRow.
// Let's replace the specific buttons: Save, Pass, Edit, Discontinue/Reactivate

content = content.replace(
  /variant="ghost"\s*>\s*Save\s*<\/PrimaryButton>/g,
  'variant="ghost"\n                iconOnly\n              >\n                Save\n              </PrimaryButton>'
);
content = content.replace(
  /variant="ghost"\s*>\s*Pass\s*<\/PrimaryButton>/g,
  'variant="ghost"\n                  iconOnly\n                >\n                  Pass\n                </PrimaryButton>'
);
content = content.replace(
  /variant="ghost"\s*>\s*Edit\s*<\/PrimaryButton>/g,
  'variant="ghost"\n                  iconOnly\n                >\n                  Edit\n                </PrimaryButton>'
);
content = content.replace(
  /variant="danger"\s*>\s*Discontinue\s*<\/PrimaryButton>/g,
  'variant="danger"\n              iconOnly\n            >\n              Discontinue\n            </PrimaryButton>'
);
content = content.replace(
  /variant="muted"\s*>\s*Reactivate\s*<\/PrimaryButton>/g,
  'variant="muted"\n              iconOnly\n            >\n              Reactivate\n            </PrimaryButton>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Added iconOnly to StaffRow buttons");
