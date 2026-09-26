const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/[firmId]/page.tsx', 'utf8');

const target = `        <div>
          <label className="text-xs text-muted font-medium block mb-1">Workspace Slug</label>
          <div className="text-primary font-medium">{firm.slug}</div>
        </div>`;

const replacement = `        <div>
          <label className="text-xs text-muted font-medium block mb-1">Workspace Slug</label>
          <div className="text-primary font-medium">{firm.slug}</div>
        </div>
        <div>
          <label className="text-xs text-muted font-medium block mb-1">Subscription Plan</label>
          <div className="text-primary font-medium uppercase">{firm.planType || "unknown"}</div>
        </div>`;

c = c.replace(target, replacement);
c = c.replace(/useEffect\(\(\) => \{ if \(!resolvedParams\) return;/, 'useEffect(() => { Promise.resolve(params).then(setResolvedParams); }, [params]);\n  useEffect(() => { if (!resolvedParams) return;');

fs.writeFileSync('src/app/super-admin/firms/[firmId]/page.tsx', c);
console.log("Patched firm detail page");
