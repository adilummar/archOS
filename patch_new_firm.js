const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/firms/new/page.tsx', 'utf8');

const target = `    if (!res.ok) {
      setError(body.error || "Failed to create firm");
    } else {
      router.push("/super-admin/firms");
    }`;

const replacement = `    if (!res.ok) {
      setError(body.error || "Failed to create firm");
    } else {
      setSuccessData({ slug: body.data.slug, password: body.data._tempAdminPassword });
    }`;

c = c.replace(target, replacement);
c = c.replace(/const \[error, setError\] = useState\(""\);/, `const [error, setError] = useState("");\n  const [successData, setSuccessData] = useState<{slug: string, password: string} | null>(null);`);

const uiTarget = `return (
    <div className="max-w-2xl">`;

const uiReplacement = `if (successData) {
    return (
      <div className="max-w-2xl bg-surface border border-border p-8 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-4 text-green-600">Firm Provisioned Successfully!</h1>
        <p className="mb-6 text-muted">Please provide the following temporary credentials to the Firm Admin. They will be forced to change this password on their first login.</p>
        
        <div className="bg-canvas p-6 rounded border border-border mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-border">
            <span className="text-muted">Workspace URL:</span>
            <span className="col-span-2 font-mono font-medium">{window.location.origin}/{successData.slug}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <span className="text-muted">Temporary Password:</span>
            <span className="col-span-2 font-mono font-medium text-lg text-primary">{successData.password}</span>
          </div>
        </div>
        
        <button onClick={() => router.push("/super-admin/firms")} className="px-4 py-2 bg-accent text-white rounded font-medium hover:bg-accent-muted transition-colors">
          Back to Firms
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">`;

c = c.replace(uiTarget, uiReplacement);

fs.writeFileSync('src/app/super-admin/firms/new/page.tsx', c);
console.log("Patched super-admin new firm page");
