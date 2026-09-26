const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/settings/page.tsx', 'utf8');

if (!content.includes('PasswordInput')) {
  content = content.replace(
    /import \{ useState \} from "react";/,
    `import { useState } from "react";\nimport { PasswordInput } from "@/components/ui/PasswordInput";`
  );

  content = content.replace(
    /<input\s+type="password"\s+required\s+value=\{currentPassword\}\s+onChange=\{\(e\) => setCurrentPassword\(e\.target\.value\)\}\s+className="p-2 border border-border rounded bg-canvas text-primary"\s*\/>/gs,
    `<PasswordInput required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary pr-10" />`
  );

  content = content.replace(
    /<input\s+type="password"\s+required\s+value=\{newPassword\}\s+onChange=\{\(e\) => setNewPassword\(e\.target\.value\)\}\s+className="p-2 border border-border rounded bg-canvas text-primary"\s*\/>/gs,
    `<PasswordInput required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary pr-10" />`
  );

  content = content.replace(
    /<input\s+type="password"\s+required\s+value=\{confirmPassword\}\s+onChange=\{\(e\) => setConfirmPassword\(e\.target\.value\)\}\s+className="p-2 border border-border rounded bg-canvas text-primary"\s*\/>/gs,
    `<PasswordInput required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary pr-10" />`
  );

  fs.writeFileSync('src/app/super-admin/settings/page.tsx', content);
  console.log("Patched super-admin settings page");
}
