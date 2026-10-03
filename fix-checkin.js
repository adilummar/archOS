const fs = require('fs');

let file1 = 'src/hooks/useAttendance.ts';
let content1 = fs.readFileSync(file1, 'utf-8');
content1 = content1.replace(/checkIn: useMutation\(\{\n\s*mutationFn: \(\) => api\.post<any>\(\`\/api\/v1\/attendance\/check-in\?firmId=\$\{firmId\}\`, \{\}\),/g, 'checkIn: useMutation({\n      mutationFn: (data: any) => api.post<any>(`/api/v1/attendance/check-in?firmId=${firmId}`, data),');
fs.writeFileSync(file1, content1);

let file2 = 'src/app/api/v1/attendance/check-in/route.ts';
let content2 = fs.readFileSync(file2, 'utf-8');
content2 = content2.replace(/const data = await AttendanceService\.checkIn\(ctx, \{ userId: ctx\.userId \}\);/, 'const body = await req.json();\n  const data = await AttendanceService.checkIn(ctx, { userId: ctx.userId, firmId: body.firmId, projectId: body.projectId, taskId: body.taskId });');
fs.writeFileSync(file2, content2);
