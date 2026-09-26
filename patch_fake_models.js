const fs = require('fs');

// Patch login page
let loginC = fs.readFileSync('src/app/[firmSlug]/login/page.tsx', 'utf8');
loginC = loginC.replace(/const fakeFirm: Firm = \{[\s\S]*?settings: \{[\s\S]*?\}[\s\S]*?\};/, `const fakeFirm: Firm = {
        id: data.data.firm.id,
        name: data.data.firm.name,
        slug: data.data.firm.slug,
        status: data.data.firm.status || "ACTIVE",
        onboardingState: data.data.firm.onboardingState || "COMPLETED",
        enabledFeatures: data.data.firm.enabledFeatures || [],
        logo: undefined,
        address: "TBD",
        phone: "TBD",
        email: "TBD",
        gstin: "TBD",
        website: undefined,
        planType: "starter",
        createdAt: new Date().toISOString(),
        priorityPeriodDays: 3,
        minimumTaskLeadTimeDays: 3,
        settings: {
          defaultFileRequestWindowDays: 7,
          clientApprovalReminderDays: 2,
          clientApprovalEscalateDays: 5,
          defaultCurrency: "USD",
          drawingNumberingEnabled: true,
          maxClientSessions: 3,
          portalBranding: {}
        }
      };`);
fs.writeFileSync('src/app/[firmSlug]/login/page.tsx', loginC);

// Patch DBProvider
let dbC = fs.readFileSync('src/components/providers/DBProvider.tsx', 'utf8');
dbC = dbC.replace(/const mappedFirm: Firm = \{[\s\S]*?settings: rawFirm\.settings as any,[\s\S]*?\};/g, `const mappedFirm: Firm = {
          id: rawFirm.id,
          name: rawFirm.name,
          slug: rawFirm.slug || "",
          status: rawFirm.status as any || "ACTIVE",
          onboardingState: rawFirm.onboardingState as any || "COMPLETED",
          enabledFeatures: rawFirm.enabledFeatures || [],
          logo: rawFirm.logo || undefined,
          address: rawFirm.address,
          phone: rawFirm.phone,
          email: rawFirm.email,
          gstin: rawFirm.gstin,
          website: rawFirm.website || undefined,
          planType: rawFirm.planType as any,
          priorityPeriodDays: rawFirm.priorityPeriodDays,
          minimumTaskLeadTimeDays: rawFirm.minimumTaskLeadTimeDays,
          createdAt: rawFirm.createdAt instanceof Date ? rawFirm.createdAt.toISOString() : rawFirm.createdAt,
          settings: rawFirm.settings as any,
        };`);
fs.writeFileSync('src/components/providers/DBProvider.tsx', dbC);
console.log("Patched fake models");
