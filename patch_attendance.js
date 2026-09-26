
const fs = require("fs");
const file = "src/app/actions/attendance.actions.ts";
let content = fs.readFileSync(file, "utf8");
content = content.replace(/const session = await getSession\(\);/g, "const authSession = await getSession();");
content = content.replace(/!session\.userId/g, "!authSession.userId");
content = content.replace(/session\.userId/g, "authSession.userId");
fs.writeFileSync(file, content, "utf8");

