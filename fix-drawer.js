const fs = require('fs');

let content = fs.readFileSync('src/components/project/NewProjectDrawer.tsx', 'utf-8');

content = content.replace(/const newClientRecord = await createClient\(\{[\s\S]*?\}\);/, `const newClientRecord = await createClientMut.mutateAsync({
          name: newClientName.trim(),
          email: newClientEmail.trim() || "no-email@example.com",
        });`);

content = content.replace(/const project = await instantiateProjectFromTemplate\(\{[\s\S]*?\}\);/, `const project = await instantiateProjectMut.mutateAsync({
        templateId,
        name: name.trim(),
        clientId: finalClientId,
        clientName: finalClientName,
        teamLeadId,
        staffIds,
        location: location.trim(),
        description: "",
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate).toISOString() : undefined,
        feeAgreed: feeAgreed ? Number(feeAgreed) : undefined,
      });`);

fs.writeFileSync('src/components/project/NewProjectDrawer.tsx', content);
