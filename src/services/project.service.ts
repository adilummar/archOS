import { withAuthTx } from "@/lib/db-tx";
import { AuthContext } from "./auth.service";
import { prisma } from "@/lib/db";

// â”€â”€ GET all projects for a firm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getProjects(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.project.findMany({
          where: {
            firmId
          },
          include: {
            client: {
              select: {
                name: true,
                company: true
              }
            },
            teamLead: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true
              }
            },
            staffMembers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarInitials: true,
                    avatarColor: true
                  }
                }
              }
            },
            stages: {
              orderBy: {
                order: "asc"
              }
            },
            _count: {
              select: {
                tasks: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        });
      });
    });
  });
}

// â”€â”€ GET a single project â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getProject(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.project.findUnique({
          where: {
            id: projectId
          },
          include: {
            client: true,
            teamLead: {
              select: {
                id: true,
                name: true,
                avatarInitials: true,
                avatarColor: true
              }
            },
            staffMembers: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarInitials: true,
                    avatarColor: true,
                    role: true
                  }
                }
              }
            },
            stages: {
              orderBy: {
                order: "asc"
              }
            },
            tasks: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    avatarInitials: true,
                    avatarColor: true
                  }
                },
                subtasks: true
              },
              orderBy: {
                createdAt: "desc"
              }
            }
          }
        });
      });
    });
  });
}

// â”€â”€ CREATE project â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function createProject(ctx: AuthContext, data: {
  firmId: string;
  name: string;
  clientId?: string;
  clientName?: string;
  teamLeadId?: string;
  staffIds?: string[];
  location?: string;
  description?: string;
  startDate?: Date;
  expectedEndDate?: Date;
  feeAgreed?: number;
  feeStructure?: string;
  projectValue?: number;
}) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const {
          staffIds = [],
          ...rest
        } = data;
        const project = await tx.project.create({
          data: {
            ...rest,
            staffMembers: {
              create: staffIds.map(userId => ({
                userId
              }))
            }
          },
          include: {
            stages: true
          }
        });

        // Log the creation
        await tx.activityLog.create({
          data: {
            firmId: data.firmId,
            userId: data.teamLeadId,
            projectId: project.id,
            entity: "project",
            entityId: project.id,
            action: "created",
            description: `Project "${project.name}" was created`
          }
        });
        return project;
      });
    });
  });
}

// â”€â”€ UPDATE project â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function updateProject(ctx: AuthContext, projectId: string, data: Partial<any>) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const project = await tx.project.update({
          where: {
            id: projectId
          },
          data
        });
        return project;
      });
    });
  });
}

// â”€â”€ ADD staff to project â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function addStaffToProject(ctx: AuthContext, projectId: string, userId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.projectStaff.upsert({
          where: {
            projectId_userId: {
              projectId,
              userId
            }
          },
          create: {
            projectId,
            userId
          },
          update: {}
        });
      });
    });
  });
}

// â”€â”€ REMOVE staff from project â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function removeStaffFromProject(ctx: AuthContext, projectId: string, userId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.projectStaff.delete({
          where: {
            projectId_userId: {
              projectId,
              userId
            }
          }
        });
      });
    });
  });
}

// â”€â”€ CREATE project stage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function createProjectStage(ctx: AuthContext, data: {
  projectId: string;
  name: string;
  order: number;
  description?: string;
  isClientApprovalRequired?: boolean;
  plannedEndDate?: Date;
}) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.projectStage.create({
          data
        });
      });
    });
  });
}

// â”€â”€ UPDATE stage status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function updateStageStatus(ctx: AuthContext, stageId: string, status: string, firmId: string, userId?: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const stage = await tx.projectStage.update({
          where: {
            id: stageId
          },
          data: {
            status,
            actualEndDate: status === "completed" ? new Date() : undefined
          },
          include: {
            project: true
          }
        });
        await tx.activityLog.create({
          data: {
            firmId: ctx.firmId,
            userId,
            projectId: stage.projectId,
            entity: "stage",
            entityId: stageId,
            action: "status_changed",
            description: `Stage "${stage.name}" moved to ${status}`
          }
        });
        return stage;
      });
    });
  });
}

// â”€â”€â”€ INSTANTIATE PROJECT FROM TEMPLATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function instantiateProjectFromTemplate(ctx: AuthContext, data: {
  firmId: string;
  templateId: string;
  name: string;
  clientId?: string;
  clientName?: string;
  teamLeadId?: string;
  staffIds?: string[];
  location?: string;
  description?: string;
  startDate?: Date;
  expectedEndDate?: Date;
  feeAgreed?: number;
  projectValue?: number;
}) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const {
          staffIds = [],
          templateId,
          ...rest
        } = data;
        let template = await tx.projectTemplate.findUnique({
          where: {
            id: templateId
          },
          include: {
            stages: {
              include: {
                tasks: true
              }
            }
          }
        });
        if (!template) {
          template = await tx.projectTemplate.findFirst({
            where: {
              firmId: data.firmId
            },
            include: {
              stages: {
                include: {
                  tasks: true
                }
              }
            }
          });
          if (!template) throw new Error("Template not found");
        }
        const project = await tx.project.create({
          data: {
            ...rest,
            templateId: template.id,
            feeStructure: template.feeStructure,
            fileRequestWindowDays: template.defaultFileRequestWindowDays,
            staffMembers: {
              create: staffIds.map(userId => ({
                userId
              }))
            }
          }
        });
        for (const [index, tStage] of template.stages.entries()) {
          const stage = await tx.projectStage.create({
            data: {
              projectId: project.id,
              name: tStage.name,
              order: tStage.order,
              description: tStage.description,
              isClientApprovalRequired: tStage.isClientApprovalRequired,
              status: index === 0 ? "in_progress" : "pending"
            }
          });
          for (const tTask of tStage.tasks) {
            await tx.task.create({
              data: {
                firmId: project.firmId,
                projectId: project.id,
                stageId: stage.id,
                title: tTask.title,
                description: tTask.description,
                priority: tTask.priority,
                assigneeId: rest.teamLeadId || staffIds[0],
                assignerId: rest.teamLeadId || staffIds[0]
              }
            });
          }
        }
        await tx.activityLog.create({
          data: {
            firmId: data.firmId,
            userId: data.teamLeadId,
            projectId: project.id,
            entity: "project",
            entityId: project.id,
            action: "created",
            description: `Project "${project.name}" was instantiated from template "${template.name}"`
          }
        });
        return project;
      });
    });
  });
}

// ─── UPDATE PROJECT TEMPLATE ─────────────────────────────────────
export async function updateProjectTemplate(ctx: AuthContext, firmId: string, projectId: string, newTemplateId: string, actorId?: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        const project = await tx.project.findUnique({
          where: {
            id: projectId
          }
        });
        if (!project) throw new Error("Project not found");
        const template = await tx.projectTemplate.findUnique({
          where: {
            id: newTemplateId
          },
          include: {
            stages: {
              include: {
                tasks: true
              }
            }
          }
        });
        if (!template) throw new Error("Template not found");
        await Promise.all([tx.taskReviewCycle.deleteMany({
          where: {
            task: {
              projectId
            }
          }
        }), tx.subtask.deleteMany({
          where: {
            task: {
              projectId
            }
          }
        }), tx.task.deleteMany({
          where: {
            projectId
          }
        }), tx.projectStage.deleteMany({
          where: {
            projectId
          }
        }), tx.project.update({
          where: {
            id: projectId
          },
          data: {
            templateId: newTemplateId
          }
        })]);
        for (const [index, tStage] of template.stages.entries()) {
          const stage = await tx.projectStage.create({
            data: {
              projectId,
              name: tStage.name,
              order: tStage.order,
              description: tStage.description,
              isClientApprovalRequired: tStage.isClientApprovalRequired,
              status: index === 0 ? "in_progress" : "pending"
            }
          });
          for (const tTask of tStage.tasks) {
            await tx.task.create({
              data: {
                firmId: ctx.firmId,
                projectId,
                stageId: stage.id,
                title: tTask.title,
                description: tTask.description,
                priority: tTask.priority,
                assigneeId: project.teamLeadId || actorId || "",
                assignerId: actorId || project.teamLeadId || ""
              }
            });
          }
        }
        if (actorId) {
          await tx.activityLog.create({
            data: {
              firmId: ctx.firmId,
              userId: actorId,
              projectId,
              entity: "project",
              entityId: projectId,
              action: "updated",
              description: `Project template changed to "${template.name}". All tasks were replaced.`
            }
          });
        }
        return true;
      });
    });
  });
}
export async function getTemplatesByFirm(ctx: AuthContext, firmId: string) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.projectTemplate.findMany({
          where: {
            firmId: ctx.firmId
          },
          include: {
            stages: {
              orderBy: {
                order: "asc"
              },
              include: {
                tasks: {
                  orderBy: {
                    order: "asc"
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        });
      });
    });
  });
}
export async function createClient(ctx: AuthContext, data: {
  firmId: string;
  name: string;
  email: string;
}) {
  return withAuthTx(ctx, async tx => {
    return withAuthTx(ctx, async tx => {
      return withAuthTx(ctx, async tx => {
        return tx.client.create({
          data: {
            firmId: data.firmId,
            name: data.name,
            email: data.email
          }
        });
      });
    });
  });
}

export async function deleteProject(ctx: AuthContext, projectId: string) {
  return withAuthTx(ctx, async tx => {
    return tx.project.delete({
      where: { id: projectId }
    });
  });
}
