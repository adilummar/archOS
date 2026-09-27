const fs = require('fs');
let code = fs.readFileSync('src/app/api/v1/tasks/route.ts', 'utf8');

code = code.replace('const tasks = await TaskService.getAllTasksByFirm(ctx, firmId || ctx.firmId);',
`let tasks = [];
  if (ctx.role === 'admin' || ctx.role === 'super_admin' || ctx.role === 'accounts') {
     tasks = await TaskService.getAllTasksByFirm(ctx, firmId || ctx.firmId);
  } else if (ctx.role === 'team_lead') {
     const active = await TaskService.getTeamLeadActiveTasks(ctx, ctx.userId);
     const review = await TaskService.getTeamLeadReviewQueue(ctx, ctx.userId);
     const assigned = await TaskService.getStaffAssignedTasks(ctx, ctx.userId);
     const map = new Map();
     active.forEach((t) => map.set(t.id, t));
     review.forEach((t) => map.set(t.id, t));
     assigned.forEach((t) => map.set(t.id, t));
     tasks = Array.from(map.values());
  } else {
     tasks = await TaskService.getStaffAssignedTasks(ctx, ctx.userId);
  }`);

fs.writeFileSync('src/app/api/v1/tasks/route.ts', code);
