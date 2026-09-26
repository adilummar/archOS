const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', 'utf8');

c = c.replace(
  'updateFirm(liveFirm.id, {\n      minimumTaskLeadTimeDays: parseInt(form.minimumTaskLeadTimeDays) || 3,\n    });\n    updateFirmSettings(liveFirm.id, {',
  `updateFirm(liveFirm.id, {
      minimumTaskLeadTimeDays: parseInt(form.minimumTaskLeadTimeDays) || 3,
    });
    const authStore = useAuthStore.getState();
    if (authStore.firm && authStore.firm.id === liveFirm.id) {
       useAuthStore.setState({ firm: { ...authStore.firm, minimumTaskLeadTimeDays: parseInt(form.minimumTaskLeadTimeDays) || 3 } });
    }
    updateFirmSettings(liveFirm.id, {`
);

fs.writeFileSync('src/app/[firmSlug]/(app)/settings/page.tsx', c);
