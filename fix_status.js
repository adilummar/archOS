const fs = require('fs');

const file = 'src/components/shared/StatusBadge.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Task statuses\s*todo:/;
const replacement = `// Task statuses
  future:                 { label: "Future",          color: "var(--color-text-muted)",     bg: "rgb(107 107 112 / 0.12)" },
  assigned:               { label: "Assigned",        color: "var(--color-info)",            bg: "var(--color-info-muted)" },
  submitted_for_review:   { label: "For Review",      color: "var(--color-warning)",         bg: "var(--color-warning-muted)" },
  todo:`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed StatusBadge');
