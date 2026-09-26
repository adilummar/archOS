const fs = require('fs');
let p = fs.readFileSync('src/app/[firmSlug]/(app)/projects/page.tsx', 'utf8');

// I will just read the file and swap lines manually or search/replace the block.
p = p.replace(
  'const { projects: uiProjects } = useProjectStore();\n  const { data: projects = [] } = useProjects(firm?.id || "");\n  const deleteProjectMut = useDeleteProject(firm?.id || "");\n  const deleteProject = (id: string) => deleteProjectMut.mutateAsync(id);\n  const { tasks } = useTaskStore();\n  const { users } = useFirmStore();\n  const { user, firm } = useAuthStore();',
  'const { tasks } = useTaskStore();\n  const { users } = useFirmStore();\n  const { user, firm } = useAuthStore();\n  const { projects: uiProjects } = useProjectStore();\n  const { data: projects = [] } = useProjects(firm?.id || "");\n  const deleteProjectMut = useDeleteProject(firm?.id || "");\n  const deleteProject = (id: string) => deleteProjectMut.mutateAsync(id);'
);

fs.writeFileSync('src/app/[firmSlug]/(app)/projects/page.tsx', p);
