const fs = require('fs');

const file = 'src/app/[firmSlug]/(app)/staff/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('import { useStaff')) {
  content = content.replace('import { useTasks } from "@/hooks/useTasks";', 'import { useTasks } from "@/hooks/useTasks";\nimport { useStaff, useAddStaff, useUpdateStaff } from "@/hooks/useStaff";');
}

// Remove old Server Actions imports
content = content.replace(/import \{ getStaffWithAttendance.*?\} from "@\/app\/actions\/staff\.actions";/, '');

// Replace state
content = content.replace(/const \[staff, setStaff\] = useState<StaffWithAttendance>\(\[\]\);\n\s*const \[load, setLoad\] = useState\(0\);\n/g, '');
content = content.replace(/const \{ data: tasks = \[\] \} = useTasks\(firm\?\.id \|\| ""\);\n/, 'const { data: tasks = [] } = useTasks(firm?.id || "");\n  const { data: staff = [], isLoading } = useStaff(firm?.id || "");\n  const addStaffMut = useAddStaff(firm?.id || "");\n  const updateStaffMut = useUpdateStaff(firm?.id || "");\n');

// Replace handleAddStaff
content = content.replace(/const result = await addStaffMember\(\{[\s\S]*?\}\);/g, `const result = await addStaffMut.mutateAsync({
        firmId: firm.id,
        name: newStaffName,
        email: newStaffEmail,
        role: newStaffRole,
        designation: newStaffDesignation,
      });`);
content = content.replace(/setLoad\(\(l\) => l \+ 1\);/g, '');

// Replace handleSuspendConfirm
content = content.replace(/if \(showSuspendModal\.status === "active"\) \{\n\s*await suspendStaffMember\(showSuspendModal\.id\);\n\s*\} else \{\n\s*await unsuspendStaffMember\(showSuspendModal\.id\);\n\s*\}/, `if (showSuspendModal.status === "active") {
        await updateStaffMut.mutateAsync({ staffId: showSuspendModal.id, data: { action: "suspend" } });
      } else {
        await updateStaffMut.mutateAsync({ staffId: showSuspendModal.id, data: { action: "unsuspend" } });
      }`);

// Replace handlePasswordConfirm
content = content.replace(/await changeStaffPassword\(showPasswordModal\.id, newPassword\);/, `await updateStaffMut.mutateAsync({ staffId: showPasswordModal.id, data: { action: "password", password: newPassword } });`);

// Replace load effect
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?fetchStaff\(\);[\s\S]*?\}\s*fetchStaff\(\);[\s\S]*?\}, \[user, firm, isAdmin, isTeamLead, load\]\);/g, '');

content = content.replace(/loading \? \(/g, 'isLoading ? (');
content = content.replace(/if \(loading\)/g, 'if (isLoading)');

fs.writeFileSync(file, content);
