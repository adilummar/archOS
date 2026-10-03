const fs = require('fs');
let c = fs.readFileSync('prisma/migrations/20261001000002_rls_policies/migration.sql', 'utf8');
c = c.replace(/DO.*?;\n/s, '');
fs.writeFileSync('prisma/migrations/20261001000002_rls_policies/migration.sql', c);
