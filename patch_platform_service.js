const fs = require('fs');
let c = fs.readFileSync('src/services/platform.service.ts', 'utf8');

// We need to inject crypto for random bytes, or just Math.random string. Node crypto is better.
const importCrypto = `import crypto from "crypto";\n`;
if (!c.includes('import crypto')) {
  c = importCrypto + c;
}

// Update createFirmWithAdmin
const target = `
      // 3. Create initial Firm Admin
      // Password is null by default. They must establish it on first login via a secure setup link.
      // (For now, since invitation isn't implemented, we allow null password and the login route handles it).
      // Wait, the schema allows passwordHash to be nullable.
      await tx.user.create({
        data: {
          firmId: firm.id,
          name: adminName,
          email: adminEmail.toLowerCase().trim(),
          role: "admin",
          status: "active"
        }
      });

      return firm;`;

const replacement = `
      // 3. Create initial Firm Admin with temporary password
      const tempPassword = crypto.randomBytes(6).toString("hex"); // 12 char random password
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      
      const admin = await tx.user.create({
        data: {
          firmId: firm.id,
          name: adminName,
          email: adminEmail.toLowerCase().trim(),
          role: "admin",
          status: "active",
          passwordHash
        }
      });

      return { ...firm, _tempAdminPassword: tempPassword };`;

c = c.replace(target, replacement);

fs.writeFileSync('src/services/platform.service.ts', c);
console.log("Patched platform.service.ts");
