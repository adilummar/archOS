const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/projects/page.tsx';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(/const { data: projects = \[\], isLoading } = useProjects\(firm\?\.id \|\| ""\);/, 'const { data: projects = [], isLoading, error } = useProjects(firm?.id || "");');

const errorBlock = `
  if (error) {
    const err = error as any;
    const msg = err.code === "FEATURE_DISABLED" ? "Feature not enabled for this firm" : err.message || "Failed to load projects";
    return (
      <div style={{ padding: 20, color: "var(--color-destructive)" }}>
        <h3>Error Loading Projects</h3>
        <p>{msg}</p>
      </div>
    );
  }
`;

content = content.replace(/if \(!firm \|\| !user\) return null;/, 'if (!firm || !user) return null;' + errorBlock);

fs.writeFileSync(file, content);
