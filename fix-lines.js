const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/staff/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

const lines = content.split('\n');
const newLines = lines.filter(l => !l.includes('getStaffWithAttendance') && !l.includes('getTeamLeadStaffWithAttendance') && !l.includes('setStaff('));

fs.writeFileSync(file, newLines.join('\n'));
