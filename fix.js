const fs = require('fs');
const files = [
  'src/app/[firmSlug]/(app)/projects/page.tsx',
  'src/app/[firmSlug]/(app)/projects/[projectId]/page.tsx',
  'src/app/[firmSlug]/(app)/tasks/page.tsx',
  'src/components/project/OverviewTab.tsx',
  'src/components/project/TasksTab.tsx',
  'src/components/tasks/StaffTasksView.tsx',
  'src/app/[firmSlug]/(app)/finance/page.tsx',
  'src/components/project/ChangeRequestsTab.tsx',
  'src/components/project/FinanceTab.tsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    c = c.split('isPast(parseISO(task.dueDate!))').join('(task.dueDate ? isPast(parseISO(task.dueDate)) : false)');
    c = c.split('isToday(parseISO(task.dueDate!))').join('(task.dueDate ? isToday(parseISO(task.dueDate)) : false)');
    c = c.split('isPast(parseISO(inv.dueDate!))').join('(inv.dueDate ? isPast(parseISO(inv.dueDate)) : false)');
    c = c.split('format(parseISO(task.dueDate!), "d MMM yyyy")').join('(task.dueDate ? format(parseISO(task.dueDate), "d MMM yyyy") : "")');
    c = c.split('format(parseISO(task.dueDate!), "dd MMM yyyy")').join('(task.dueDate ? format(parseISO(task.dueDate), "dd MMM yyyy") : "")');
    c = c.split('format(parseISO(task.dueDate!), "d MMM")').join('(task.dueDate ? format(parseISO(task.dueDate), "d MMM") : "")');
    c = c.split('differenceInDays(parseISO(task.dueDate!), new Date())').join('(task.dueDate ? differenceInDays(parseISO(task.dueDate), new Date()) : 0)');
    c = c.split('differenceInDays(parseISO(project.expectedEndDate!), new Date())').join('(project.expectedEndDate ? differenceInDays(parseISO(project.expectedEndDate), new Date()) : 0)');
    c = c.split('differenceInDays(parseISO(p.expectedEndDate!), new Date())').join('(p.expectedEndDate ? differenceInDays(parseISO(p.expectedEndDate), new Date()) : 0)');
    c = c.split('format(parseISO(project.expectedEndDate!), "d MMM yyyy")').join('(project.expectedEndDate ? format(parseISO(project.expectedEndDate), "d MMM yyyy") : "")');
    c = c.split('format(parseISO(p.expectedEndDate!), "d MMM yyyy")').join('(p.expectedEndDate ? format(parseISO(p.expectedEndDate), "d MMM yyyy") : "")');
    
    // also remove ! for ones we missed
    c = c.replace(/parseISO\((p|project|task|a|b|inv|req)\.(expectedEndDate|dueDate|responseDueDate)!\)/g, 'parseISO($1.$2)');

    fs.writeFileSync(f, c);
  }
});
