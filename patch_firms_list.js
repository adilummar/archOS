const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/page.tsx', 'utf8');

c = c.replace(/<th className="p-4 font-medium">Initial Admin<\/th>/, `<th className="p-4 font-medium">Plan</th>\n              <th className="p-4 font-medium">Initial Admin</th>`);

c = c.replace(/<td className="p-4 text-muted">\{f.users\?\.\[0\]\?\.email \|\| "None"\}<\/td>/, `<td className="p-4 text-muted"><span className="px-2 py-1 bg-surface border border-border rounded text-xs uppercase tracking-wider font-medium">{f.planType || 'unknown'}</span></td>\n                <td className="p-4 text-muted">{f.users?.[0]?.email || "None"}</td>`);

fs.writeFileSync('src/app/super-admin/firms/page.tsx', c);
console.log("Patched firms list page");
