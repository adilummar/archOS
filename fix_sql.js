const fs = require('fs');
let c = fs.readFileSync('prisma/migrations/20261001000000_init/migration.sql', 'utf8');
c = c.replace(/"startedAt" TIMESTAMP\(3\),/g, '');
fs.writeFileSync('prisma/migrations/20261001000000_init/migration.sql', c);
