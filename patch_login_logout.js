
const fs = require("fs");
let content = fs.readFileSync("src/app/[firmSlug]/login/page.tsx", "utf-8");

content = content.replace(
  /const \[selectedRole, setSelectedRole\] = useState<Role>\("admin"\);/,
  `const [selectedRole, setSelectedRole] = useState<Role>("admin");\n\n    useEffect(() => {\n      useAuthStore.getState().logout();\n    }, []);`
);

fs.writeFileSync("src/app/[firmSlug]/login/page.tsx", content);
console.log("Patched login auto-logout");

