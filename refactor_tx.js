const fs = require('fs');

const files = fs.readdirSync('src/services').filter(f => f.endsWith('.service.ts') && f !== 'auth.service.ts');

files.forEach(f => {
  let content = fs.readFileSync('src/services/' + f, 'utf-8');
  if (!content.includes('withAuthTx')) {
    content = content.replace('import { prisma } from "@/lib/db";', 'import { prisma } from "@/lib/db";\nimport { withAuthTx } from "@/lib/db-tx";');
  }
  
  // Replace simple prisma.<model> calls with withAuthTx
  // This is too brittle.
});
