"use client";

/**
 * DBProvider — fetches PostgreSQL data via server actions and hydrates Zustand.
 *
 * Pure client component. Renders nothing. Fires once on mount per firmSlug.
 * Also syncs the auth store user's ID to the real PostgreSQL user ID by email.
 */

import { useEffect } from "react";
import { useProjectStore } from "@/lib/store/project.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useTaskStore } from "@/lib/store/task.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { getFirmBySlug, getStaffByFirm, getProjectsByFirm } from "@/app/actions/bootstrap.actions";
import { getAllTasksByFirm } from "@/app/actions/task.actions";
import { getTemplatesByFirm } from "@/app/actions/project.actions";
import type { FileCategory } from "@/lib/store/types";

interface DBProviderProps {
  firmSlug: string;
}

export function DBProvider({ firmSlug }: DBProviderProps) {
  useEffect(() => {
    async function loadFromDB() {
      try {
        const firm = await getFirmBySlug(firmSlug);
        if (!firm) return;

        const [staff, projects, dbTasks, dbTemplates] = await Promise.all([
          getStaffByFirm(firm.id),
          getProjectsByFirm(firm.id),
          getAllTasksByFirm(firm.id),
          getTemplatesByFirm(firm.id),
        ]);

        // ── Hydrate firm store ───────────────────────────────────────────
        const zustandFirm = {
          slug: firm.slug || "",
          status: (firm.status || "ACTIVE") as any,
          onboardingState: (firm.onboardingState || "COMPLETED") as any,
          enabledFeatures: firm.enabledFeatures || [],
          id: firm.id,
          name: firm.name,
          logo: firm.logo ?? undefined,
          address: firm.address,
          phone: firm.phone,
          email: firm.email,
          gstin: firm.gstin ?? "",
          website: firm.website ?? undefined,
          planType: firm.planType as "starter" | "professional" | "enterprise",
          priorityPeriodDays: firm.priorityPeriodDays,
          minimumTaskLeadTimeDays: firm.minimumTaskLeadTimeDays,
          settings: {
            defaultFileRequestWindowDays: 7,
            clientApprovalReminderDays: 3,
            clientApprovalEscalateDays: 7,
            defaultCurrency: "INR",
            drawingNumberingEnabled: true,
            maxClientSessions: 3,
            portalBranding: {},
          },
          createdAt: firm.createdAt.toISOString(),
        };

        const zustandUsers = staff.map((u) => ({
          id: u.id,
          firmId: u.firmId,
          name: u.name,
          email: u.email,
          phone: u.phone ?? "",
          role: u.role as "admin" | "team_lead" | "staff" | "accounts",
          designation: u.designation ?? "",
          avatarInitials: u.avatarInitials ?? u.name.slice(0, 2).toUpperCase(),
          avatarColor: u.avatarColor ?? "#E85D04",
          costRatePerHour: u.costRatePerHour,
          joinedAt: u.joinedAt.toISOString(),
          status: u.status as "active" | "discontinued",
          discontinuedAt: u.discontinuedAt?.toISOString(),
        }));

        // Hydrate templates
        const zustandTemplates = dbTemplates.map((t: any) => ({
          id: t.id,
          firmId: t.firmId,
          name: t.name,
          description: t.description ?? "",
          stages: t.stages.map((s: any) => ({
            id: s.id,
            name: s.name,
            order: s.order,
            defaultDurationDays: s.defaultDurationDays,
            description: s.description ?? "",
            isClientApprovalRequired: s.isClientApprovalRequired,
            isPaymentMilestone: s.isPaymentMilestone,
            paymentPercentage: s.paymentPercentage ?? undefined,
            drawingTypesExpected: s.drawingTypesExpected as FileCategory[],
            tasks: s.tasks ? s.tasks.map((task: any) => ({ id: task.id, stageId: task.stageId, title: task.title, description: task.description ?? "", order: task.order, priority: task.priority })) : [],
          })),
          feeStructure: t.feeStructure as "lump_sum" | "percentage" | "per_stage",
          defaultFileRequestWindowDays: t.defaultFileRequestWindowDays,
          isDefault: t.isDefault,
        }));

        useFirmStore.setState((firmState) => {
          const existingFirmIdx = firmState.firms.findIndex((f) => f.id === firm.id);
          if (existingFirmIdx === -1) {
            firmState.firms.push(zustandFirm);
          } else {
            firmState.firms[existingFirmIdx] = zustandFirm;
          }

          firmState.users = [];
          for (const u of zustandUsers) {
            const idx = firmState.users.findIndex((x) => x.id === u.id);
            if (idx === -1) {
              firmState.users.push(u);
            } else {
              firmState.users[idx] = u;
            }
          }

          firmState.templates = firmState.templates.filter(t => t.firmId !== firm.id);
          firmState.templates.push(...zustandTemplates);
        });

        // ── SYNC AUTH STORE WITH SERVER SESSION ───────
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const { user } = await authRes.json();
          if (user) {
            const authState = useAuthStore.getState();
            authState.login(
              {
                id: user.id,
                firmId: user.firmId,
                name: user.name,
                email: user.email,
                phone: user.phone ?? "",
                role: user.role,
                designation: user.designation ?? "",
                avatarInitials: user.avatarInitials ?? user.name.slice(0, 2).toUpperCase(),
                avatarColor: user.avatarColor ?? "#E85D04",
                costRatePerHour: user.costRatePerHour,
                joinedAt: user.joinedAt,
                status: user.status,
              },
              zustandFirm
            );
          }
        }

        // ── Hydrate project store ────────────────────────────────────────
        const zustandProjects = projects.map((p) => ({
          id: p.id,
          firmId: p.firmId,
          name: p.name,
          clientId: p.clientId ?? "",
          clientName: p.clientName ?? "",
          contractorIds: [] as string[],
          status: p.status as "active" | "on_hold" | "completed" | "cancelled",
          stages: p.stages.map((s) => ({
            id: s.id,
            name: s.name,
            order: s.order,
            status: s.status as "pending" | "in_progress" | "completed" | "blocked",
            isClientApprovalRequired: s.isClientApprovalRequired,
            clientApprovalStatus: s.clientApprovalStatus as
              | "pending"
              | "approved"
              | "revision_requested"
              | undefined,
            clientApprovalNote: s.clientApprovalNote ?? undefined,
            clientApprovedAt: s.clientApprovedAt?.toISOString(),
            startDate: s.startDate?.toISOString(),
            plannedEndDate: s.plannedEndDate?.toISOString(),
            actualEndDate: s.actualEndDate?.toISOString(),
            description: s.description ?? "",
            drawingTypesExpected: [] as FileCategory[],
            isCustom: false,
          })),
          currentStageId:
            p.stages.find((s) => s.status === "in_progress")?.id ??
            p.stages[0]?.id ??
            "",
          staffIds: p.staffMembers.map((sm) => sm.userId),
          teamLeadId: p.teamLeadId ?? undefined,
          location: p.location ?? "",
          startDate: p.startDate?.toISOString() ?? new Date().toISOString(),
          expectedEndDate:
            p.expectedEndDate?.toISOString() ?? new Date().toISOString(),
          actualEndDate: p.actualEndDate?.toISOString(),
          projectValue: p.projectValue ?? undefined,
          feeAgreed: p.feeAgreed ?? 0,
          feeStructure: (p.feeStructure ?? "lump_sum") as
            | "lump_sum"
            | "percentage"
            | "per_stage",
          description: p.description ?? undefined,
          fileRequestWindowDays: 7,
          chatEnabled: p.chatEnabled,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));

        useProjectStore.setState((projectState) => {
          for (const p of zustandProjects) {
            const idx = projectState.projects.findIndex((x) => x.id === p.id);
            if (idx === -1) {
              projectState.projects.push(p);
            } else {
              projectState.projects[idx] = { ...projectState.projects[idx], ...p };
            }
          }
        });

        // ── Hydrate task store ───────────────────────────────────────────
        const zustandTasks = dbTasks.map((t) => ({
          id: t.id,
          firmId: t.firmId,
          projectId: t.projectId,
          stageId: t.stageId ?? "",
          title: t.title,
          description: t.description ?? undefined,
          assigneeId: t.assigneeId ?? "",
          assignerId: t.assignerId ?? "",
          status: t.status as "todo" | "in_progress" | "review" | "approved" | "done" | "blocked",
          priority: t.priority as "low" | "normal" | "high",
          dueDate: t.dueDate?.toISOString() ?? new Date().toISOString(),
          startDate: t.startDate?.toISOString(),
          completedAt: t.completedAt?.toISOString(),
          isBlocked: t.isBlocked,
          blockedReason: t.blockedReason ?? undefined,
          reviewCycles: t.reviewCycles?.map((r: any) => ({
            revisionNumber: r.revisionNumber,
            remark: r.remark,
            requestedDueDate: r.requestedDueDate?.toISOString()
          })),
          subtasks: t.subtasks.map((s) => ({
            id: s.id,
            title: s.title,
            completed: s.completed,
            createdById: s.createdById ?? "",
            assignedToId: s.assignedToId ?? "",
            createdAt: s.createdAt.toISOString(),
            completedAt: s.completedAt?.toISOString(),
          })),
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }));

        useTaskStore.setState((taskState) => {
          for (const t of zustandTasks) {
            const idx = taskState.tasks.findIndex((x) => x.id === t.id);
            if (idx === -1) {
              taskState.tasks.push(t);
            } else {
              taskState.tasks[idx] = { ...taskState.tasks[idx], ...t };
            }
          }
        });

        console.log(
          `[DBProvider] ✅ Loaded ${projects.length} projects, ${staff.length} staff, ${dbTasks.length} tasks for "${firm.name}"`
        );
      } catch (err) {
        console.warn("[DBProvider] DB fetch failed, falling back to demo data:", err);
      }
    }

    loadFromDB();
  }, [firmSlug]);

  return null;
}



