const fs = require('fs');

// Patch projects/page.tsx
let p = fs.readFileSync('src/app/[firmSlug]/(app)/projects/page.tsx', 'utf8');

p = p.replace(
  'import { useProjectStore } from "@/lib/store/project.store";',
  'import { useProjectStore } from "@/lib/store/project.store";\nimport { useProjects, useDeleteProject } from "@/hooks/useProjects";'
);
p = p.replace(
  'const { projects, deleteProject } = useProjectStore();',
  'const { projects: uiProjects } = useProjectStore();\n  const { data: projects = [] } = useProjects(firm?.id || "");\n  const deleteProjectMut = useDeleteProject(firm?.id || "");\n  const deleteProject = (id: string) => deleteProjectMut.mutateAsync(id);'
);

fs.writeFileSync('src/app/[firmSlug]/(app)/projects/page.tsx', p);

// Patch NewProjectDrawer.tsx
let np = fs.readFileSync('src/components/project/NewProjectDrawer.tsx', 'utf8');

np = np.replace(
  'import { createProject } from "@/app/actions/project.actions";',
  'import { useCreateProject } from "@/hooks/useProjects";'
);
np = np.replace('import { useProjectStore } from "@/lib/store/project.store";\r\n', '');
np = np.replace('import { useProjectStore } from "@/lib/store/project.store";\n', '');

np = np.replace(
  'const firm = useAuthStore((s) => s.firm);',
  'const firm = useAuthStore((s) => s.firm);\n  const createProjectMut = useCreateProject(firm?.id || "");'
);

np = np.replaceAll('await createProject({', 'await createProjectMut.mutateAsync({');

// Remove useProjectStore.getState().addProject
np = np.replace(/useProjectStore\.getState\(\)\.addProject\(\{[\s\S]*?\}\);/g, '');

fs.writeFileSync('src/components/project/NewProjectDrawer.tsx', np);

// Patch EditProjectDrawer.tsx
let ep = fs.readFileSync('src/components/project/EditProjectDrawer.tsx', 'utf8');

ep = ep.replace(
  'import { updateProject } from "@/app/actions/project.actions";',
  'import { useUpdateProject } from "@/hooks/useProjects";'
);
ep = ep.replace('import { useProjectStore } from "@/lib/store/project.store";\r\n', '');
ep = ep.replace('import { useProjectStore } from "@/lib/store/project.store";\n', '');

ep = ep.replace(
  'const firm = useAuthStore((s) => s.firm);',
  'const firm = useAuthStore((s) => s.firm);\n  const updateProjectMut = useUpdateProject(firm?.id || "");'
);

ep = ep.replace(/await updateProject\(project\.id, /g, 'await updateProjectMut.mutateAsync({ projectId: project.id, data: ');
ep = ep.replace(/updateProjectMut\.mutateAsync\(\{ projectId: project\.id, data: (\{.*?\})\);/g, 'updateProjectMut.mutateAsync({ projectId: project.id, data:  });');

ep = ep.replace(/useProjectStore\.getState\(\)\.updateProject\([\s\S]*?\}\);/g, '');

fs.writeFileSync('src/components/project/EditProjectDrawer.tsx', ep);
