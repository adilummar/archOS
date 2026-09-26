const fs = require('fs');

let layout = fs.readFileSync('src/app/super-admin/layout.tsx', 'utf8');

// Add usePathname import
layout = layout.replace(
  /import \{ useRouter \} from "next\/navigation";/,
  `import { useRouter, usePathname } from "next/navigation";`
);

// Add usePathname hook and conditional logic
layout = layout.replace(
  /const router = useRouter\(\);/,
  `const router = useRouter();\n  const pathname = usePathname();\n\n  const isLoginPage = pathname === "/super-admin/login";`
);

// Conditionally render the aside
layout = layout.replace(
  /<aside className="w-64 bg-sidebar border-r border-border flex flex-col p-4 shrink-0">/,
  `{!isLoginPage && (<aside className="w-64 bg-sidebar border-r border-border flex flex-col p-4 shrink-0">`
);

// Close the conditional block around the aside
layout = layout.replace(
  /<\/aside>/,
  `</aside>)}`
);

// Adjust the main container if it's the login page so it centers properly
layout = layout.replace(
  /<main className="flex-1 overflow-auto bg-canvas relative p-8">/,
  `<main className={\`flex-1 overflow-auto bg-canvas relative \${isLoginPage ? "" : "p-8"}\`}>`
);

fs.writeFileSync('src/app/super-admin/layout.tsx', layout);
console.log("Patched super-admin layout.tsx");
