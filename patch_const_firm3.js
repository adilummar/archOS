const fs = require('fs');
let c = fs.readFileSync('src/app/[firmSlug]/login/page.tsx', 'utf8');

c = c.replace(/const firm: Firm = \{[\s\S]*?\/\/ 5\. Success \-\> create iron-session/, `const firm: Firm = {
        id: dbUser.firm.id,
        name: dbUser.firm.name,
        slug: (dbUser.firm as any).slug || "",
        status: (dbUser.firm as any).status || "ACTIVE",
        onboardingState: (dbUser.firm as any).onboardingState || "COMPLETED",
        enabledFeatures: (dbUser.firm as any).enabledFeatures || [],
        logo: dbUser.firm.logo,
        address: dbUser.firm.address,
        phone: dbUser.firm.phone,
        email: dbUser.firm.email,
        gstin: dbUser.firm.gstin ?? "",
        website: dbUser.firm.website,
        planType: dbUser.firm.planType as Firm["planType"],
        priorityPeriodDays: 3,
        minimumTaskLeadTimeDays: 3,
        settings: {
          defaultFileRequestWindowDays: 7,
          clientApprovalReminderDays: 3,
          clientApprovalEscalateDays: 7,
          defaultCurrency: "INR",
          drawingNumberingEnabled: true,
          maxClientSessions: 3,
          portalBranding: {},
        },
        createdAt: dbUser.firm.createdAt,
      };

      // 5. Success -> create iron-session`);

fs.writeFileSync('src/app/[firmSlug]/login/page.tsx', c);
console.log("Patched const firm for real");
