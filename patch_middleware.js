const fs = require('fs');

let middleware = fs.readFileSync('src/middleware.ts', 'utf8');

// Add super admin login endpoints to PUBLIC_PATHS
middleware = middleware.replace(
  /"\/api\/auth\/logout",/,
  `"/api/auth/logout",\n  "/api/auth/super-admin/login",\n  "/api/auth/super-admin/logout",`
);

fs.writeFileSync('src/middleware.ts', middleware);
console.log("Patched middleware.ts");
