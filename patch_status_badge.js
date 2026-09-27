const fs = require('fs');
let c = fs.readFileSync('src/components/shared/StatusBadge.tsx', 'utf8');

c = c.replace(/todo:.*\},/g, 'future: { label: "Future", color: "var(--color-text-muted)", bg: "rgb(107 107 112 / 0.12)" },\n  active: { label: "Active", color: "var(--color-warning)", bg: "var(--color-warning-muted)" },\n  assigned: { label: "Assigned", color: "var(--color-info)", bg: "var(--color-info-muted)" },');
c = c.replace(/review:.*\},/g, 'submitted_for_review: { label: "Review", color: "var(--color-warning)", bg: "var(--color-warning-muted)" },');
c = c.replace(/done:.*\},/g, 'completed: { label: "Completed", color: "var(--color-success)", bg: "var(--color-success-muted)" },');
c = c.replace(/approved:.*\},/g, ''); // we mapped it to completed

fs.writeFileSync('src/components/shared/StatusBadge.tsx', c);
