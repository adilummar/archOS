const fs = require('fs');

function processService(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/"use server";\r?\n/g, '');
  content = content.replace(/import \{ getSession \} from "@\/lib\/session";\r?\n/g, '');
  content = content.replace(/import \{ revalidatePath \} from "next\/cache";\r?\n/g, '');
  content = `import { AuthContext } from "./auth.service";\n` + content;
  
  const authBlockRegex = /const session = await getSession\(\);\s*if \(\!session\.userId\) throw new Error\("Unauthorized"\);\s*const currentUser = await prisma\.user\.findUnique\(\{\s*where: \{ id: session\.userId \},\s*select: \{ id: true, firmId: true, role: true \}\s*\}\);\s*if \(\!currentUser\) throw new Error\("Unauthorized"\);/g;
  content = content.replace(authBlockRegex, '');
  
  const simpleAuthBlockRegex = /const session = await getSession\(\);\s*if \(\!session\.userId\) throw new Error\("Unauthorized"\);/g;
  content = content.replace(simpleAuthBlockRegex, '');

  content = content.replace(/export async function ([a-zA-Z0-9_]+)\(([^)]*)\) \{/g, (match, funcName, args) => {
    if (args.trim() === '') {
      return `export async function ${funcName}(ctx: AuthContext) {`;
    }
    return `export async function ${funcName}(ctx: AuthContext, ${args}) {`;
  });
  
  content = content.replace(/currentUser\.id/g, 'ctx.userId');
  content = content.replace(/currentUser\.firmId/g, 'ctx.firmId');
  content = content.replace(/revalidatePath\([^)]+\);\r?\n/g, '');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

function processActions(actionPath, servicePath) {
  let serviceContent = fs.readFileSync(servicePath, 'utf-8');
  const funcRegex = /export async function ([a-zA-Z0-9_]+)\(ctx: AuthContext(?:,\s*([^)]*))?\)\s*\{/g;
  let match;
  let actionCode = `"use server";\nimport { getSession } from "@/lib/session";\nimport { getAuthContext } from "@/services/auth.service";\nimport { revalidatePath } from "next/cache";\nimport * as Service from "@/services/${servicePath.split('/').pop().replace('.ts', '')}";\n\nasync function getCtx() {\n  const session = await getSession();\n  if (!session.userId) throw new Error("Unauthorized");\n  return getAuthContext(session.userId);\n}\n\n`;
  
  while ((match = funcRegex.exec(serviceContent)) !== null) {
    const funcName = match[1];
    const argsStr = match[2] || '';
    const callArgs = argsStr.split(',').map(arg => arg.split(':')[0].trim().split('?')[0]).filter(Boolean).join(', ');
    let passArgs = callArgs ? `, ${callArgs}` : '';
    
    actionCode += `export async function ${funcName}(${argsStr}) {\n  const ctx = await getCtx();\n  const result = await Service.${funcName}(ctx${passArgs});\n`;
    actionCode += `  return result;\n}\n\n`;
  }
  
  fs.writeFileSync(actionPath, actionCode, 'utf-8');
}

const files = ['attendance', 'bootstrap', 'log', 'staff', 'user'];
for (const f of files) {
  const actionPath = `src/app/actions/${f}.actions.ts`;
  const servicePath = `src/services/${f}.service.ts`;
  fs.copyFileSync(actionPath, servicePath);
  processService(servicePath);
  processActions(actionPath, servicePath);
}
