const fs = require('fs');
const c = fs.readFileSync('src/app/[firmSlug]/(app)/staff/page.tsx', 'utf8');

// Find the closing of StaffPage function
// Look for the pattern before StaffGroup function definition
const marker = '\r\n// \u2500\u2500 STAFF GROUP';
const idx = c.indexOf(marker);
console.log('marker idx:', idx);
if (idx < 0) {
  // Try different variations
  const lines = c.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('STAFF GROUP') || (l.includes('StaffGroup') && l.includes('function'))) {
      console.log(i, JSON.stringify(l));
    }
  });
}
