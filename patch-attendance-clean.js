const fs = require('fs');

const file = 'src/services/attendance.service.ts';
let content = fs.readFileSync(file, 'utf-8');

// Patch checkIn
content = content.replace(
  /export async function checkIn\([\s\S]*?const authSession = await getSession\(\);/,
  (match) => match + `\n        if (!data.taskId || !data.projectId) { throw new Error("A task and project must be selected to check in."); }`
);

// Patch Stop Counting
if (!content.includes('export async function stopCounting')) {
  const newMethod = `
// STOP COUNTING
export async function stopCounting(ctx: AuthContext, sessionId: string) {
  return withAuthTx(ctx, async tx => {
    if (!ctx.userId) throw new Error("Unauthorized");
    const session = await tx.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { taskSegments: { orderBy: { startTime: 'desc' }, take: 1 } }
    });
    if (!session) throw new Error("Session not found");
    if (session.userId !== ctx.userId) throw new Error("Unauthorized");

    const now = new Date();
    const currentSegment = session.taskSegments.find((s: any) => !s.endTime);

    if (currentSegment) {
      const minutesBetween = (start: Date, end: Date) => Math.floor((end.getTime() - start.getTime()) / 60000);
      await tx.taskTimeSegment.update({
        where: { id: currentSegment.id },
        data: {
          endTime: now,
          durationMinutes: minutesBetween(new Date(currentSegment.startTime), now)
        }
      });
    }

    const updated = await tx.attendanceSession.update({
      where: { id: sessionId },
      data: {
        currentProjectId: null,
        currentTaskId: null,
      },
    });
    return updated;
  });
}
`;
  content += newMethod;
}

fs.writeFileSync(file, content);
console.log('Patched attendance cleanly');
