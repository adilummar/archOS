const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/(app)/layout.tsx', 'utf8');

const target = `  // Intercept uncompleted onboarding
  useEffect(() => {
    if (firm && firm.onboardingState !== "COMPLETED") {
      if (!pathname.includes("/onboarding")) {
        router.replace(\`/\${params.firmSlug}/onboarding\`);
      }
    }
  }, [firm, pathname, params.firmSlug, router]);`;

const replacement = `  // Intercept uncompleted onboarding and unauthorized feature access
  useEffect(() => {
    if (!firm) return;
    if (firm.onboardingState !== "COMPLETED") {
      if (!pathname.includes("/onboarding")) {
        router.replace(\`/\${params.firmSlug}/onboarding\`);
      }
      return;
    }

    // Map segments to feature keys
    const featureMap: Record<string, string> = {
      dashboard: "DASHBOARD",
      staff: "STAFF",
      projects: "PROJECTS",
      tasks: "TASKS",
      attendance: "ATTENDANCE",
      time: "TIME",
      leave: "LEAVE",
      meetings: "MEETINGS",
      rfi: "RFI",
      "site-reports": "SITE_REPORTS",
      crm: "CRM",
      finance: "FINANCE",
      "change-requests": "CHANGE_REQUESTS",
      "variation-orders": "VARIATION_ORDERS"
    };

    const segment = pathname.split("/").pop() ?? "";
    const requiredFeature = featureMap[segment];
    if (requiredFeature && !firm.enabledFeatures.includes(requiredFeature)) {
      router.replace(\`/\${params.firmSlug}/dashboard\`);
    }
  }, [firm, pathname, params.firmSlug, router]);`;

c = c.replace(target, replacement);
fs.writeFileSync('src/app/[firmSlug]/(app)/layout.tsx', c);
console.log("Patched layout.tsx route guard");
