const fs = require('fs');
let content = fs.readFileSync('src/app/[firmSlug]/onboarding/page.tsx', 'utf8');

// Import PasswordInput
content = content.replace(
  /import \{ useState, useEffect \} from "react";/,
  `import { useState, useEffect } from "react";\nimport { PasswordInput } from "@/components/ui/PasswordInput";`
);

// Replace inputs in Step 0
content = content.replace(
  /<input type="password" required placeholder="Temporary Password" value=\{oldPassword\} onChange=\{e => setOldPassword\(e\.target\.value\)\} className="p-2 border border-border rounded bg-canvas text-primary" \/>/g,
  `<PasswordInput required placeholder="Temporary Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary pr-10" />`
);

content = content.replace(
  /<input type="password" required placeholder="New Password" value=\{newPassword\} onChange=\{e => setNewPassword\(e\.target\.value\)\} className="p-2 border border-border rounded bg-canvas text-primary" \/>/g,
  `<PasswordInput required placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary pr-10" />`
);

content = content.replace(
  /<input type="password" required placeholder="Confirm New Password" value=\{confirmPassword\} onChange=\{e => setConfirmPassword\(e\.target\.value\)\} className="p-2 border border-border rounded bg-canvas text-primary" \/>/g,
  `<PasswordInput required placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary pr-10" />`
);

fs.writeFileSync('src/app/[firmSlug]/onboarding/page.tsx', content);
console.log("Patched onboarding page");
