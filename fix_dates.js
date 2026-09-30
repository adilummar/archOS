const fs = require('fs');
let code = fs.readFileSync('src/services/project.service.ts', 'utf8');

const oldBlock = `            const { staffIds, contractorIds, updatedAt, ...rest } = data;\r\n            const updateData = { ...rest };\r\n            if (Array.isArray(staffIds)) {\r\n              updateData.staffMembers = { deleteMany: {}, create: staffIds.map(userId => ({ userId })) };\r\n            }\r\n            return updateData;`;

const newBlock = `            const { staffIds, contractorIds, updatedAt, ...rest } = data;\r\n            const updateData = { ...rest };\r\n            // Convert date-only strings (YYYY-MM-DD) to full ISO DateTime for Prisma\r\n            if (updateData.startDate && typeof updateData.startDate === 'string' && updateData.startDate.length === 10) {\r\n              updateData.startDate = new Date(updateData.startDate + 'T00:00:00.000Z');\r\n            }\r\n            if (updateData.expectedEndDate && typeof updateData.expectedEndDate === 'string' && updateData.expectedEndDate.length === 10) {\r\n              updateData.expectedEndDate = new Date(updateData.expectedEndDate + 'T00:00:00.000Z');\r\n            }\r\n            if (updateData.actualEndDate && typeof updateData.actualEndDate === 'string' && updateData.actualEndDate.length === 10) {\r\n              updateData.actualEndDate = new Date(updateData.actualEndDate + 'T00:00:00.000Z');\r\n            }\r\n            if (Array.isArray(staffIds)) {\r\n              updateData.staffMembers = { deleteMany: {}, create: staffIds.map(userId => ({ userId })) };\r\n            }\r\n            return updateData;`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/services/project.service.ts', code);
  console.log('Fixed!');
} else {
  // Try with LF only
  const oldLF = oldBlock.replace(/\r\n/g, '\n');
  const newLF = newBlock.replace(/\r\n/g, '\n');
  if (code.includes(oldLF)) {
    code = code.replace(oldLF, newLF);
    fs.writeFileSync('src/services/project.service.ts', code);
    console.log('Fixed (LF)!');
  } else {
    console.log('Block not found. Searching for fragments...');
    console.log('Has staffIds line:', code.includes('const { staffIds, contractorIds, updatedAt, ...rest } = data;'));
  }
}
