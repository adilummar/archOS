const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/layout.tsx', 'utf8');

const target = `// If no auth in Zustand (e.g. after tab restore), redirect to login.`;
const replacement = `// Intercept uncompleted onboarding
  useEffect(() => {
    if (firm && firm.onboardingState !== "COMPLETED") {
      if (!pathname.includes("/onboarding")) {
        router.replace(\`/\${params.firmSlug}/onboarding\`);
      }
    }
  }, [firm, pathname, params.firmSlug, router]);

  // If no auth in Zustand (e.g. after tab restore), redirect to login.`;

c = c.replace(target, replacement);
fs.writeFileSync('src/app/[firmSlug]/(app)/layout.tsx', c);
console.log("Patched layout");
