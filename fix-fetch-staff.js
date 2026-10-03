const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/staff/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The `load` effect should be entirely removed
content = content.replace(/const fetchStaff = async \(\) => \{[\s\S]*?setLoading\(false\);\n\s*\};\n\n\s*fetchStaff\(\);\n\s*\}, \[user, firm, isAdmin, isTeamLead\]\);/g, '');

content = content.replace(/useEffect\(\(\) => \{\n\s*const fetchStaff = async \(\) => \{[\s\S]*?\}\s*fetchStaff\(\);\n\s*\}, \[.*?\]\);\n/g, '');

fs.writeFileSync(file, content);
