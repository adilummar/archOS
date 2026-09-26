const fs = require('fs');
let c = fs.readFileSync('src/lib/api-client.ts', 'utf8');
c = 'import type { Task, Project } from "@/lib/store/types";\n' + c;
c = c.replace(/export async function fetchTasks\(firmId: string\) \{/g, 'export async function fetchTasks(firmId: string): Promise<Task[]> {');
c = c.replace(/export async function fetchProjects\(firmId: string\) \{/g, 'export async function fetchProjects(firmId: string): Promise<Project[]> {');
fs.writeFileSync('src/lib/api-client.ts', c);
