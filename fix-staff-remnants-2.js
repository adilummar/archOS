const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/staff/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The `load` effect should be entirely removed
content = content.replace(/const fetchStaff = async \(\) => \{[\s\S]*?setStaff\(data\);\n\s*\}\n\s*\} catch \(error: any\) \{\n\s*toast\(error.message, "error"\);\n\s*\} finally \{\n\s*setLoading\(false\);\n\s*\}\n\s*\};\n\n\s*fetchStaff\(\);\n\s*\}, \[user, firm, isAdmin, isTeamLead\]\);/g, '');

content = content.replace(/useEffect\(\(\) => \{\n\s*const fetchStaff = async \(\) => \{[\s\S]*?\}\s*fetchStaff\(\);\n\s*\}, \[.*?\]\);\n/g, '');

// Clean up suspend
content = content.replace(/const handleSuspendConfirm = async \(\) => \{\n\s*if \(!showSuspendModal\) return;\n\s*setActionLoading\(true\);\n\s*try \{\n\s*if \(showSuspendModal.status === "active"\) \{\n\s*await suspendStaffMember\(showSuspendModal.id\);\n\s*\} else \{\n\s*await unsuspendStaffMember\(showSuspendModal.id\);\n\s*\}/, `const handleSuspendConfirm = async () => {\n    if (!showSuspendModal) return;\n    setActionLoading(true);\n    try {\n      if (showSuspendModal.status === "active") {\n        await updateStaffMut.mutateAsync({ staffId: showSuspendModal.id, data: { action: "suspend" } });\n      } else {\n        await updateStaffMut.mutateAsync({ staffId: showSuspendModal.id, data: { action: "unsuspend" } });\n      }`);

fs.writeFileSync(file, content);
