const fs = require('fs');
let c = fs.readFileSync('src/middleware.ts','utf8');
c = c.replace('const PUBLIC_PATHS = [', 'const PUBLIC_PATHS = ["/api/health", ');
fs.writeFileSync('src/middleware.ts', c);
