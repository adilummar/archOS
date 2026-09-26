const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/[firmId]/page.tsx', 'utf8');

const target = `        <div>
          <label className="text-xs text-muted font-medium block mb-1">Subscription Plan</label>
          <div className="text-primary font-medium uppercase">{firm.planType || "unknown"}</div>
        </div>`;

const replacement = `        <div>
          <label className="text-xs text-muted font-medium block mb-1">Subscription Plan</label>
          <select 
            value={firm.planType || "starter"} 
            onChange={async (e) => {
              const newPlan = e.target.value;
              const res = await fetch(\`/api/v1/platform/firms/\${firm.id}\`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planType: newPlan })
              });
              if (res.ok) {
                setFirm({ ...firm, planType: newPlan });
              }
            }}
            className="p-1 border border-border rounded bg-canvas text-primary uppercase text-sm font-medium cursor-pointer"
          >
            <option value="starter">STARTER</option>
            <option value="professional">PROFESSIONAL</option>
            <option value="enterprise">ENTERPRISE</option>
          </select>
        </div>`;

c = c.replace(target, replacement);

fs.writeFileSync('src/app/super-admin/firms/[firmId]/page.tsx', c);
console.log("Patched UI for Firm Detail Plan Dropdown");
