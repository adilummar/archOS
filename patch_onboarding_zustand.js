const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/onboarding/page.tsx', 'utf8');

c = c.replace(/const \{ user, firm, fetchAuthData \} = useAuthStore\(\);/, 'const { user, firm, login } = useAuthStore();');
c = c.replace(/await fetchAuthData\(\); \/\/ Refetch zustand store so layout passes us/, 'if (user && firm) login(user, { ...firm, onboardingState: "COMPLETED" });');

fs.writeFileSync('src/app/[firmSlug]/onboarding/page.tsx', c);
