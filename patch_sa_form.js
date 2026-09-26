const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/new/page.tsx', 'utf8');

c = c.replace(/adminName: formData.get\("adminName"\),/g, 'adminName: formData.get("adminName"),\n      planType: formData.get("planType"),');

const targetHtml = `<div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Firm Email *</label>`;

const replacementHtml = `<div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs text-muted font-medium">Subscription Plan *</label>
              <select name="planType" required className="p-2 border border-border rounded bg-canvas text-primary">
                <option value="starter">Starter (PM, Tasks, Staff, Attendance)</option>
                <option value="professional">Professional (All MVP features)</option>
                <option value="enterprise">Enterprise (All MVP features)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted font-medium">Firm Email *</label>`;

c = c.replace(targetHtml, replacementHtml);
fs.writeFileSync('src/app/super-admin/firms/new/page.tsx', c);
console.log("Patched Super Admin form with planType");
