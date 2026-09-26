const fs = require('fs');
let c = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

const targetItem = `interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: Role[];
}`;

const replacementItem = `interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  allowedRoles?: Role[];
  requiredFeature?: string;
}`;

c = c.replace(targetItem, replacementItem);

const targetNav = `function getNavGroups(firmSlug: string): NavGroup[] {
  return [`;

const replacementNav = `function getNavGroups(firmSlug: string, enabledFeatures: string[] = []): NavGroup[] {
  const hasFeature = (f: string) => enabledFeatures.includes(f);

  return [`;

c = c.replace(targetNav, replacementNav);

// Add requiredFeature tags
c = c.replace(`label: "Dashboard",`, `label: "Dashboard", requiredFeature: "DASHBOARD",`);
c = c.replace(`label: "Staff",`, `label: "Staff", requiredFeature: "STAFF",`);
c = c.replace(`label: "Projects",`, `label: "Projects", requiredFeature: "PROJECTS",`);
c = c.replace(`label: "Tasks",`, `label: "Tasks", requiredFeature: "TASKS",`);
c = c.replace(`label: "Attendance",`, `label: "Attendance", requiredFeature: "ATTENDANCE",`);
c = c.replace(`label: "Time",`, `label: "Time", requiredFeature: "TIME",`);
c = c.replace(`label: "Leave",`, `label: "Leave", requiredFeature: "LEAVE",`);

c = c.replace(`label: "Meetings",`, `label: "Meetings", requiredFeature: "MEETINGS",`);
c = c.replace(`label: "RFIs",`, `label: "RFIs", requiredFeature: "RFI",`);
c = c.replace(`label: "Site Reports",`, `label: "Site Reports", requiredFeature: "SITE_REPORTS",`);

c = c.replace(`label: "CRM",`, `label: "CRM", requiredFeature: "CRM",`);
c = c.replace(`label: "Finance",`, `label: "Finance", requiredFeature: "FINANCE",`);
c = c.replace(`label: "Change Requests",`, `label: "Change Requests", requiredFeature: "CHANGE_REQUESTS",`);
c = c.replace(`label: "Variation Orders",`, `label: "Variation Orders", requiredFeature: "VARIATION_ORDERS",`);

const targetProps = `const navGroups = getNavGroups(firmSlug);`;
const replacementProps = `const navGroups = getNavGroups(firmSlug, firm?.enabledFeatures || []).map(group => ({
    ...group,
    items: group.items.filter(item => !item.requiredFeature || (firm?.enabledFeatures || []).includes(item.requiredFeature))
  })).filter(group => group.items.length > 0);`;

c = c.replace(targetProps, replacementProps);

fs.writeFileSync('src/components/layout/Sidebar.tsx', c);
console.log("Patched Sidebar.tsx");
