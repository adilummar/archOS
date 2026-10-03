const fs = require('fs');

const file = 'src/services/task.service.ts';
let content = fs.readFileSync(file, 'utf-8');

const regex = /if \(nextTaskToActivate && nextTaskToActivate\.status === 'future'\) \{[\s\S]*?data: \{ status: 'active' \}[\s\S]*?\}/;
const newCode = `if (nextTaskToActivate && nextTaskToActivate.status === 'future') {
      const proj = await tx.project.findUnique({
        where: { id: projectId },
        include: { staffMembers: true }
      });
      const staffMembers = proj?.staffMembers || [];
      
      if (staffMembers.length === 1) {
        await tx.task.update({
          where: { id: nextTaskToActivate.id },
          data: { status: 'assigned', assigneeId: staffMembers[0].userId }
        });
        
        await tx.activityLog.create({
          data: {
            firmId: proj.firmId,
            userId: ctx.userId || 'system',
            projectId: projectId,
            entity: 'task',
            entityId: nextTaskToActivate.id,
            action: 'assigned',
            description: 'Task auto-assigned to single staff member'
          }
        });
      } else {
        await tx.task.update({
          where: { id: nextTaskToActivate.id },
          data: { status: 'active' }
        });
      }
    }`;

content = content.replace(regex, newCode);
fs.writeFileSync(file, content);
console.log('Patched activateNextTask');
