const fs = require('fs');

const file = 'src/hooks/useAttendance.ts';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(/checkOut: useMutation\(\{\n\s*mutationFn: \(\) => api.post<any>\(\`\/api\/v1\/attendance\/check-out\?firmId=\$\{firmId\}\`, \{\}\),/g, 'checkOut: useMutation({\n      mutationFn: ({ sessionId }: { sessionId: string }) => api.post<any>(`/api/v1/attendance/check-out?firmId=${firmId}`, { sessionId }),');

content = content.replace(/startBreak: useMutation\(\{\n\s*mutationFn: \(type: string\) => api.post<any>\(\`\/api\/v1\/attendance\/break-start\?firmId=\$\{firmId\}\`, \{ type \}\),/g, 'startBreak: useMutation({\n      mutationFn: ({ sessionId, type }: { sessionId: string, type: string }) => api.post<any>(`/api/v1/attendance/break-start?firmId=${firmId}`, { sessionId, type }),');

content = content.replace(/endBreak: useMutation\(\{\n\s*mutationFn: \(\) => api.post<any>\(\`\/api\/v1\/attendance\/break-end\?firmId=\$\{firmId\}\`, \{\}\),/g, 'endBreak: useMutation({\n      mutationFn: ({ sessionId }: { sessionId: string }) => api.post<any>(`/api/v1/attendance/break-end?firmId=${firmId}`, { sessionId }),');

fs.writeFileSync(file, content);
