const fs = require('fs');
const filePath = 'src/services/project.service.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldFunc = `export async function getProjects(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.project.findMany({
          where: {
            firmId
          },`;

const newFunc = `export async function getProjects(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
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

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Patched getProjects safely");
} else {
  console.log("Could not find exact function signature to replace.");
}
