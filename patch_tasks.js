const fs = require('fs');
const filePath = 'src/services/task.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldFunc = `export async function getAllTasksByFirm(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.task.findMany({
      where: { firmId },`;

const newFunc = `export async function getAllTasksByFirm(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async (tx) => {
    let where: any = { firmId };
    if (ctx.role !== "admin") {
      where.project = {
        OR: [
          { teamLeadId: ctx.userId },
          { staffMembers: { some: { userId: ctx.userId } } }
        ]
      };
    }
    return tx.task.findMany({
      where,`;

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Patched getAllTasksByFirm");
} else {
  console.log("Could not find exact function signature to replace.");
}
