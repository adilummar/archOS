"use client";
/**
 * OverviewTab — project overview: stage list with dates/milestones, client info,
 * team list, fee summary, location.
 */

import { format, parseISO } from "date-fns";
import { Key, CheckCircle2, Circle, Clock, User, MapPin, DollarSign, Calendar } from "lucide-react";
import { useFirmStore } from "../../lib/store/firm.store";
import { useAuthStore } from "../../lib/store/auth.store";
import { StatusBadge } from "../shared/StatusBadge";
import { Avatar } from "../shared/Avatar";
import type { Project } from "../../lib/store/types";

const INR_L = (n: number) => `₹${(n / 100000).toFixed(1)} L`;
const INR = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : `₹${(n / 100000).toFixed(1)} L`;

interface Props {
  project: Project;
}

export function OverviewTab({ project }: Props) {
  const { users, clients, contractors } = useFirmStore();
  const { user } = useAuthStore();

  const client = clients.find((c) => c.id === project.clientId);
  const teamUsers = users.filter((u) => project.staffIds.includes(u.id));
  const teamLead = users.find((u) => u.id === project.teamLeadId);
  const projectContractors = contractors.filter((c) => project.contractorIds.includes(c.id));

  const isAdmin = user?.role === "admin" || user?.role === "accounts";
  const feeStructureLabel: Record<string, string> = {
    per_stage: "Per Stage",
    percentage: "% of Project Value",
    lump_sum: "Lump Sum",
    hourly: "Hourly",
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: 24,
        alignItems: "start",
      }}
    >
      {/* Left — Stage list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle>Stage Progress</SectionTitle>
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          {project.stages.map((stage, i) => {
            const isCurrent = stage.id === project.currentStageId;
            const isCompleted = stage.status === "completed";
            const needsApproval =
              stage.isClientApprovalRequired && stage.clientApprovalStatus === "pending";
            const isLast = i === project.stages.length - 1;

            return (
              <div
                key={stage.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 16px",
                  borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                  background: isCurrent ? "rgba(229,82,48,0.04)" : "transparent",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isCompleted
                      ? "var(--color-success)"
                      : isCurrent
                      ? "var(--color-accent)"
                      : "var(--color-bg-input)",
                    border: `1.5px solid ${
                      isCompleted
                        ? "var(--color-success)"
                        : isCurrent
                        ? "var(--color-accent)"
                        : "var(--color-border)"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5L9.5 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : isCurrent ? (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-border-strong)" }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: isCurrent ? 600 : 500,
                        color: isCurrent
                          ? "var(--color-text-primary)"
                          : isCompleted
                          ? "var(--color-text-secondary)"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {stage.name}
                    </span>
                    {stage.isPaymentMilestone && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--color-success)",
                          background: "var(--color-success-muted)",
                          padding: "1px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {stage.paymentPercentage}% Milestone
                      </span>
                    )}
                    {needsApproval && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--color-warning)",
                          background: "var(--color-warning-muted)",
                          padding: "1px 6px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <Key size={9} strokeWidth={2} /> Client Approval Pending
                      </span>
                    )}
                    {stage.clientApprovalStatus === "approved" && stage.isClientApprovalRequired && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--color-success)",
                        }}
                      >
                        ✓ Approved
                      </span>
                    )}
                  </div>

                  {stage.description && (
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        margin: "0 0 4px",
                      }}
                    >
                      {stage.description}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {stage.startDate && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        Started {format(parseISO(stage.startDate), "d MMM yyyy")}
                      </span>
                    )}
                    {stage.actualEndDate && (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        Ended {format(parseISO(stage.actualEndDate), "d MMM yyyy")}
                      </span>
                    )}
                    {stage.clientApprovalRequestedAt && stage.clientApprovalStatus === "pending" && (
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-warning)",
                        }}
                      >
                        Approval requested {format(parseISO(stage.clientApprovalRequestedAt), "d MMM yyyy")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <StatusBadge status={stage.status} size="sm" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — Info cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Client */}
        {client && (
          <InfoCard title="Client">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>
                {client.name}
              </p>
              {client.company && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                  {client.company}
                </p>
              )}
              {client.phone && (
                <MetaRow icon={<User size={12} strokeWidth={1.5} />} value={client.phone} />
              )}
              {client.email && (
                <MetaRow icon={<User size={12} strokeWidth={1.5} />} value={client.email} />
              )}
              {client.address && (
                <MetaRow icon={<MapPin size={12} strokeWidth={1.5} />} value={client.address} />
              )}
              {client.portalEnabled && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--color-success)",
                    background: "var(--color-success-muted)",
                    padding: "2px 7px",
                    borderRadius: "var(--radius-sm)",
                    width: "fit-content",
                    fontWeight: 500,
                  }}
                >
                  Portal enabled
                </span>
              )}
            </div>
          </InfoCard>
        )}

        {/* Team */}
        <InfoCard title="Team">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {teamLead && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={teamLead.name} color={teamLead.avatarColor} initials={teamLead.avatarInitials} size="sm" />
                <div>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>
                    {teamLead.name}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--color-accent)", margin: 0 }}>Team Lead</p>
                </div>
              </div>
            )}
            {teamUsers.filter((u) => u.id !== project.teamLeadId).map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={u.name} color={u.avatarColor} initials={u.avatarInitials} size="sm" />
                <div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
                    {u.name}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--color-text-muted)", margin: 0 }}>
                    {u.designation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </InfoCard>

        {/* Fee (admin only) */}
        {isAdmin && (
          <InfoCard title="Fee & Value">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <MetaRow
                icon={<DollarSign size={12} strokeWidth={1.5} />}
                label="Project Value"
                value={project.projectValue ? INR(project.projectValue) : "—"}
              />
              <MetaRow
                icon={<DollarSign size={12} strokeWidth={1.5} />}
                label="Agreed Fee"
                value={project.feeAgreed ? INR(project.feeAgreed) : "—"}
              />
              <MetaRow
                icon={<DollarSign size={12} strokeWidth={1.5} />}
                label="Fee Structure"
                value={feeStructureLabel[project.feeStructure] ?? project.feeStructure}
              />
            </div>
          </InfoCard>
        )}

        {/* Contractors */}
        {projectContractors.length > 0 && (
          <InfoCard title="Contractors">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {projectContractors.map((c) => (
                <div key={c.id}>
                  <p style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 1px" }}>
                    {c.company}
                  </p>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                    {c.trade}
                  </p>
                </div>
              ))}
            </div>
          </InfoCard>
        )}

        {/* Location */}
        {project.location && (
          <InfoCard title="Location">
            <MetaRow icon={<MapPin size={12} strokeWidth={1.5} />} value={project.location} />
          </InfoCard>
        )}

        {/* Dates */}
        <InfoCard title="Dates">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {project.startDate && (
              <MetaRow
                icon={<Calendar size={12} strokeWidth={1.5} />}
                label="Started"
                value={format(parseISO(project.startDate), "d MMM yyyy")}
              />
            )}
            {project.expectedEndDate && (
              <MetaRow
                icon={<Calendar size={12} strokeWidth={1.5} />}
                label="Expected End"
                value={format(parseISO(project.expectedEndDate), "d MMM yyyy")}
              />
            )}
            {project.actualEndDate && (
              <MetaRow
                icon={<Calendar size={12} strokeWidth={1.5} />}
                label="Actual End"
                value={format(parseISO(project.actualEndDate), "d MMM yyyy")}
              />
            )}
          </div>
        </InfoCard>
      </div>
    </div>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        color: "var(--color-text-primary)",
        margin: 0,
        fontFamily: "var(--font-display)",
      }}
    >
      {children}
    </h3>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
          margin: "0 0 10px",
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label?: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
      {icon && (
        <span style={{ color: "var(--color-text-muted)", marginTop: 2, flexShrink: 0 }}>
          {icon}
        </span>
      )}
      <div>
        {label && (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {label}:{" "}
          </span>
        )}
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          {value}
        </span>
      </div>
    </div>
  );
}
