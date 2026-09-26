const fs = require('fs');

function processService(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove "use server", getSession, revalidatePath
  content = content.replace(/"use server";\r?\n/g, '');
  content = content.replace(/import \{ getSession \} from "@\/lib\/session";\r?\n/g, '');
  content = content.replace(/import \{ revalidatePath \} from "next\/cache";\r?\n/g, '');
  
  // Add AuthContext import
  content = `import { AuthContext } from "./auth.service";\n` + content;
  
  // Replace the auth block
  const authBlockRegex = /const session = await getSession\(\);\s*if \(\!session\.userId\) throw new Error\("Unauthorized"\);\s*const currentUser = await prisma\.user\.findUnique\(\{\s*where: \{ id: session\.userId \},\s*select: \{ id: true, firmId: true, role: true \}\s*\}\);\s*if \(\!currentUser\) throw new Error\("Unauthorized"\);/g;
  
  content = content.replace(authBlockRegex, '');
  
  // Replace function definitions to accept ctx
  content = content.replace(/export async function ([a-zA-Z0-9_]+)\(([^)]*)\) \{/g, (match, funcName, args) => {
    if (args.trim() === '') {
      return `export async function ${funcName}(ctx: AuthContext) {`;
    }
    return `export async function ${funcName}(ctx: AuthContext, ${args}) {`;
  });
  
  // Fix `currentUser.id` -> `ctx.userId`
  content = content.replace(/currentUser\.id/g, 'ctx.userId');
  content = content.replace(/currentUser\.firmId/g, 'ctx.firmId');
  
  // Remove revalidatePath calls
  content = content.replace(/revalidatePath\([^)]+\);\r?\n/g, '');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

function processActions(actionPath, servicePath) {
  let serviceContent = fs.readFileSync(servicePath, 'utf-8');
  
  // Extract function signatures
  const funcRegex = /export async function ([a-zA-Z0-9_]+)\(ctx: AuthContext(?:,\s*([^)]*))?\)\s*\{/g;
  let match;
  let actionCode = `"use server";\nimport { getSession } from "@/lib/session";\nimport { getAuthContext } from "@/services/auth.service";\nimport { revalidatePath } from "next/cache";\nimport * as Service from "@/services/${servicePath.split('/').pop().replace('.ts', '')}";\n\nasync function getCtx() {\n  const session = await getSession();\n  if (!session.userId) throw new Error("Unauthorized");\n  return getAuthContext(session.userId);\n}\n\n`;
  
  while ((match = funcRegex.exec(serviceContent)) !== null) {
    const funcName = match[1];
    const argsStr = match[2] || '';
    
    // Convert arg types to arg names for the call
    // e.g. "taskId: string, firmId: string" -> "taskId, firmId"
    const callArgs = argsStr.split(',').map(arg => arg.split(':')[0].trim().split('?')[0]).filter(Boolean).join(', ');
    
    let passArgs = callArgs ? `, ${callArgs}` : '';
    
    actionCode += `export async function ${funcName}(${argsStr}) {\n  const ctx = await getCtx();\n  const result = await Service.${funcName}(ctx${passArgs});\n`;
    
    // Add revalidatePath if it's a mutation. Hardcoding standard paths for simplicity.
    if (funcName.startsWith('create') || funcName.startsWith('update') || funcName.startsWith('delete') || funcName.startsWith('assign') || funcName.startsWith('review') || funcName.startsWith('add') || funcName.startsWith('toggle') || funcName.startsWith('instantiate')) {
      actionCode += `  revalidatePath("/[firmSlug]/projects/[projectId]", "page");\n`;
      actionCode += `  revalidatePath("/[firmSlug]/tasks", "page");\n`;
    }
    
    actionCode += `  return result;\n}\n\n`;
  }
  
  fs.writeFileSync(actionPath, actionCode, 'utf-8');
}

processService('src/services/task.service.ts');
processActions('src/app/actions/task.actions.ts', 'src/services/task.service.ts');

processService('src/services/project.service.ts');
processActions('src/app/actions/project.actions.ts', 'src/services/project.service.ts');
