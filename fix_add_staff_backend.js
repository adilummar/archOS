const fs = require('fs');
const file = 'src/app/actions/staff.actions.ts';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /if \(!caller \|\| caller\.role !== "admin"\) throw new Error\("Only admins can add staff"\);/;
const replacement1 = `if (!caller || caller.role !== "admin") return { error: "Only admins can add staff" };`;

const regex2 = /if \(existing\) throw new Error\("A user with this email already exists"\);/;
const replacement2 = `if (existing) return { error: "A user with this email already exists" };`;

content = content.replace(regex1, replacement1);
content = content.replace(regex2, replacement2);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed addStaffMember to return errors safely');
