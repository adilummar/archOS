const fs = require('fs');
const filePath = 'src/services/bootstrap.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldFunc = `export async function getProjectWithTasks(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async (tx) => {
    return tx.project.findUnique({
      where: { id: projectId },`;

const newFunc = `export async function getProjectWithTasks(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async (tx) => {
    let where: any = { id: projectId, firmId: ctx.firmId };
    if (ctx.role !== "admin") {
      where.OR = [
        { teamLeadId: ctx.userId },
        { staffMembers: { some: { userId: ctx.userId } } }
      ];
    }
    return tx.project.findFirst({
      where,`;

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Patched getProjectWithTasks");
} else {
  console.log("Regex didn't match getProjectWithTasks");
}
