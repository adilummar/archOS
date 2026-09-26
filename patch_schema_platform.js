const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!c.includes('model PlatformAdmin')) {
  const platformAdminModel = `
// --- PLATFORM ADMIN ----------------------------------------------------------

model PlatformAdmin {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
`;
  c = c + '\n' + platformAdminModel;
  fs.writeFileSync('prisma/schema.prisma', c);
}
