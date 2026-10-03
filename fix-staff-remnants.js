const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/staff/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The `load` effect should be entirely removed
content = content.replace(/const load = useCallback\(\(\) => \{[\s\S]*?\}, \[isAdmin, isTeamLead, firm, user\]\);\n/g, '');

// Also remove setLoad((l) => l + 1); if it exists
content = content.replace(/setLoad\(\(l\) => l \+ 1\);\n/g, '');

// The fetchStaff function that uses getStaffWithAttendance is inside an effect? Let's check if the whole effect is there.
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?const fetchStaff = async \(\) => \{[\s\S]*?\}\s*fetchStaff\(\);[\s\S]*?\}, \[user, firm, isAdmin, isTeamLead, load\]\);/g, '');

// If fetchStaff is not in an effect, let's remove it generally
content = content.replace(/const fetchStaff = async \(\) => \{[\s\S]*?setStaff\([\s\S]*?\}\s*\};/g, '');

// Remove suspend/unsuspend references (which I tried to replace earlier but apparently missed some)
content = content.replace(/if \(showSuspendModal\.status === "active"\) \{\n\s*await suspendStaffMember\(showSuspendModal\.id\);\n\s*\} else \{\n\s*await unsuspendStaffMember\(showSuspendModal\.id\);\n\s*\}/, `if (showSuspendModal.status === "active") {
        await updateStaffMut.mutateAsync({ staffId: showSuspendModal.id, data: { action: "suspend" } });
      } else {
        await updateStaffMut.mutateAsync({ staffId: showSuspendModal.id, data: { action: "unsuspend" } });
      }`);
      
// Fix duplicate 'staff' declaration. There might be a `const [staff, setStaff] = useState(...)` that I missed.
content = content.replace(/const \[staff, setStaff\] = useState<StaffWithAttendance>\(\[\]\);\n/g, '');

// Remove the `load()` calls inside `handleAddStaff` and others
content = content.replace(/load\(\);/g, '');

fs.writeFileSync(file, content);
