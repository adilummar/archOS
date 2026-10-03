const fs = require('fs');

const file = 'src/services/user.service.ts';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(/costRatePerHour\?: number;/g, 'costRatePerHour?: number;\n    password?: string;');
content = content.replace(/const tempPassword = crypto\.randomBytes\(6\)\.toString\("hex"\);\n\s*const passwordHash = await bcrypt\.hash\(tempPassword, 10\);/g, 'const tempPassword = data.password || crypto.randomBytes(6).toString("hex");\n      const passwordHash = await bcrypt.hash(tempPassword, 10);');

fs.writeFileSync(file, content);
