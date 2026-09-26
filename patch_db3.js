const fs = require("fs");
let content = fs.readFileSync("src/components/providers/DBProvider.tsx", "utf8");

// Fix Firm Store
content = content.replace(
  /const firmState = useFirmStore\.getState\(\);([\s\S]*?)\/\/ Upsert firm([\s\S]*?)\/\/ Replace templates for this firm\s*firmState\.templates = firmState\.templates\.filter\(t => t\.firmId !== firm\.id\);\s*firmState\.templates\.push\(\.\.\.zustandTemplates\);/m,
  `const zustandFirm = {
          id: firm.id,
          name: firm.name,
          logo: firm.logo ?? undefined,
          address: firm.address,
          phone: firm.phone,
          email: firm.email,
          gstin: firm.gstin ?? "",
          website: firm.website ?? undefined,
          planType: firm.planType as "starter" | "professional" | "enterprise",
          settings: {
            defaultFileRequestWindowDays: 7,
            clientApprovalReminderDays: 3,
            clientApprovalEscalateDays: 7,
            defaultCurrency: "INR",
            drawingNumberingEnabled: true,
            maxClientSessions: 3,
            portalBranding: {},
          },
          createdAt: firm.createdAt.toISOString(),
        };

        const zustandUsers = staff.map((u) => ({
          id: u.id,
          firmId: u.firmId,
          name: u.name,
          email: u.email,
          phone: u.phone ?? "",
          role: u.role as "admin" | "team_lead" | "staff" | "accounts",
          designation: u.designation ?? "",
          avatarInitials: u.avatarInitials ?? u.name.slice(0, 2).toUpperCase(),
          avatarColor: u.avatarColor ?? "#E85D04",
          costRatePerHour: u.costRatePerHour,
          joinedAt: u.joinedAt.toISOString(),
          status: u.status as "active" | "discontinued",
          discontinuedAt: u.discontinuedAt?.toISOString(),
        }));

        // Hydrate templates
        const zustandTemplates = dbTemplates.map((t: any) => ({
          id: t.id,
          firmId: t.firmId,
          name: t.name,
          description: t.description ?? "",
          stages: t.stages.map((s: any) => ({
            id: s.id,
            name: s.name,
            order: s.order,
            defaultDurationDays: s.defaultDurationDays,
            description: s.description ?? "",
            isClientApprovalRequired: s.isClientApprovalRequired,
            isPaymentMilestone: s.isPaymentMilestone,
            paymentPercentage: s.paymentPercentage ?? undefined,
            drawingTypesExpected: s.drawingTypesExpected as FileCategory[],
            tasks: s.tasks ? s.tasks.map((task: any) => ({ id: task.id, stageId: task.stageId, title: task.title, description: task.description ?? "", order: task.order, priority: task.priority })) : [],
          })),
          feeStructure: t.feeStructure as "lump_sum" | "percentage" | "per_stage",
          defaultFileRequestWindowDays: t.defaultFileRequestWindowDays,
          isDefault: t.isDefault,
        }));

        useFirmStore.setState((firmState) => {
          const existingFirmIdx = firmState.firms.findIndex((f) => f.id === firm.id);
          if (existingFirmIdx === -1) {
            firmState.firms.push(zustandFirm);
          } else {
            firmState.firms[existingFirmIdx] = zustandFirm;
          }

          firmState.users = [];
          for (const u of zustandUsers) {
            const idx = firmState.users.findIndex((x) => x.id === u.id);
            if (idx === -1) {
              firmState.users.push(u);
            } else {
              firmState.users[idx] = u;
            }
          }

          firmState.templates = firmState.templates.filter(t => t.firmId !== firm.id);
          firmState.templates.push(...zustandTemplates);
        });`
);

// Fix Project Store
content = content.replace(
  /const projectState = useProjectStore\.getState\(\);\s*const zustandProjects = projects\.map\(\(p\) => \(\{([\s\S]*?)\}\)\);\s*\/\/ Upsert projects \(DB takes priority\)\s*for \(const p of zustandProjects\) \{\s*const idx = projectState\.projects\.findIndex\(\(x\) => x\.id === p\.id\);\s*if \(idx === -1\) \{\s*projectState\.projects\.push\(p\);\s*\} else \{\s*projectState\.projects\[idx\] = \{ \.\.\.projectState\.projects\[idx\], \.\.\.p \};\s*\}\s*\}/m,
  `const zustandProjects = projects.map((p) => ({$1}));

        useProjectStore.setState((projectState) => {
          for (const p of zustandProjects) {
            const idx = projectState.projects.findIndex((x) => x.id === p.id);
            if (idx === -1) {
              projectState.projects.push(p);
            } else {
              projectState.projects[idx] = { ...projectState.projects[idx], ...p };
            }
          }
        });`
);

// Fix Task Store
content = content.replace(
  /const taskState = useTaskStore\.getState\(\);\s*const zustandTasks = dbTasks\.map\(\(t\) => \(\{([\s\S]*?)\}\)\);\s*\/\/ Upsert tasks — DB data takes priority over demo seed\s*for \(const t of zustandTasks\) \{\s*const idx = taskState\.tasks\.findIndex\(\(x\) => x\.id === t\.id\);\s*if \(idx === -1\) \{\s*taskState\.tasks\.push\(t\);\s*\} else \{\s*taskState\.tasks\[idx\] = \{ \.\.\.taskState\.tasks\[idx\], \.\.\.t \};\s*\}\s*\}/m,
  `const zustandTasks = dbTasks.map((t) => ({$1}));

        useTaskStore.setState((taskState) => {
          for (const t of zustandTasks) {
            const idx = taskState.tasks.findIndex((x) => x.id === t.id);
            if (idx === -1) {
              taskState.tasks.push(t);
            } else {
              taskState.tasks[idx] = { ...taskState.tasks[idx], ...t };
            }
          }
        });`
);

fs.writeFileSync("src/components/providers/DBProvider.tsx", content);
