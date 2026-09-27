const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /await addStaffMember\(\{[\s\S]*?\}\);/;
const replacement = `const res = await addStaffMember({
        firmId: authFirm.id,
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        role: fd.get("role") as any,
        designation: fd.get("designation") as string,
        costRatePerHour: Number(fd.get("costRatePerHour")) || 0
      });
      if (res && res.error) {
        toast(res.error, "error");
        return;
      }`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed handleAddStaff in settings page');
