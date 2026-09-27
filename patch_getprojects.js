const fs = require('fs');
const filePath = 'src/services/project.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /export async function getProjects\(ctx: AuthContext, firmId: string\) \{\s*return withAuthTx\(ctx, async tx => \{\s*return withAuthTx\(ctx, async tx => \{\s*return withAuthTx\(ctx, async tx => \{\s*return tx.project.findMany\(\{\s*where: \{\s*firmId\s*\},/g;

const replacement = `export async function getProjects(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async tx => {
    let where: any = { firmId };
    if (ctx.role !== "admin") {
      where.OR = [
        { teamLeadId: ctx.userId },
        { staffMembers: { some: { userId: ctx.userId } } }
      ];
    }
    return tx.project.findMany({
      where,`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Patched getProjects");
} else {
  console.log("Regex didn't match getProjects");
}
