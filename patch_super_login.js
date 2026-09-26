const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/login/page.tsx', 'utf8');

if (!content.includes('PasswordInput')) {
  content = content.replace(
    /import \{ useState \} from "react";/,
    `import { useState } from "react";\nimport { PasswordInput } from "@/components/ui/PasswordInput";`
  );

  content = content.replace(
    /<input type="password" required autoComplete="current-password" value=\{password\} onChange=\{e => setPassword\(e\.target\.value\)\} className="p-2 border border-border rounded bg-canvas text-primary" \/>/,
    `<PasswordInput required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary pr-10" />`
  );
  
  fs.writeFileSync('src/app/super-admin/login/page.tsx', content);
  console.log("Patched super-admin login page");
}
