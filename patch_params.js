const fs = require('fs');

// Patch firm API route
let apiRoute = fs.readFileSync('src/app/api/v1/platform/firms/[firmId]/route.ts', 'utf8');
apiRoute = apiRoute.replace(/params \}: \{ params: \{ firmId: string \} \}/, 'params }: { params: Promise<{ firmId: string }> }');
apiRoute = apiRoute.replace(/params.firmId/, '(await params).firmId');
fs.writeFileSync('src/app/api/v1/platform/firms/[firmId]/route.ts', apiRoute);

// Patch status API route
let statusRoute = fs.readFileSync('src/app/api/v1/platform/firms/[firmId]/status/route.ts', 'utf8');
statusRoute = statusRoute.replace(/params \}: \{ params: \{ firmId: string \} \}/, 'params }: { params: Promise<{ firmId: string }> }');
statusRoute = statusRoute.replace(/params.firmId/, '(await params).firmId');
fs.writeFileSync('src/app/api/v1/platform/firms/[firmId]/status/route.ts', statusRoute);

// Patch page
let pageRoute = fs.readFileSync('src/app/super-admin/firms/[firmId]/page.tsx', 'utf8');
pageRoute = pageRoute.replace(/params \}: \{ params: \{ firmId: string \} \}/, 'params }: { params: Promise<{ firmId: string }> }');
pageRoute = pageRoute.replace(/params.firmId/g, 'resolvedParams.firmId');
pageRoute = pageRoute.replace(/const \[firm, setFirm\] = useState<any>\(null\);/, `const [firm, setFirm] = useState<any>(null);\n  const [resolvedParams, setResolvedParams] = useState<{firmId: string} | null>(null);\n  useEffect(() => { params.then(setResolvedParams); }, [params]);`);
pageRoute = pageRoute.replace(/fetch\(\`\/api\/v1\/platform\/firms\/\$\{params.firmId\}\`\)/, `fetch(\`/api/v1/platform/firms/\${resolvedParams.firmId}\`)`);
pageRoute = pageRoute.replace(/\[params\.firmId\]\)/, `[resolvedParams])`);
pageRoute = pageRoute.replace(/useEffect\(\(\) => \{[\s\S]*?fetch\(\`\/api\/v1\/platform\/firms\/\$\{resolvedParams\.firmId\}\`\)/, `useEffect(() => { if (!resolvedParams) return; fetch(\`/api/v1/platform/firms/\${resolvedParams.firmId}\`)`);

fs.writeFileSync('src/app/super-admin/firms/[firmId]/page.tsx', pageRoute);

console.log("Patched params promises");
