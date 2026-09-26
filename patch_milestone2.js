
const fs = require("fs");
let content = fs.readFileSync("src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx", "utf-8");

content = content.replace(
  /\{activeTab === "overview" && \(/,
  `{(activeTab === "overview" || activeTab === "tasks") && (`
);

fs.writeFileSync("src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx", content);
console.log("Patched milestone vis");

