"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isToday, parseISO } from "date-fns";
import {
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  AlertCircle,
  MessageSquare,
  CalendarOff
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTaskStore } from "@/lib/store/task.store";
import { useLeaveStore } from "@/lib/store/leave.store";
import { useRfiStore } from "@/lib/store/rfi.store";

function StatCard({ label, value, icon, accent = false }: { label: string, value: number, icon: any, accent?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${accent ? 'bg-accent/5 border-accent/20' : 'bg-surface border-border'} flex flex-col gap-2`}>
      <div className={`flex justify-between items-center ${accent ? 'text-accent' : 'text-muted'}`}>
        {icon}
        {accent && <span className="text-[10px] uppercase font-bold bg-accent/10 px-2 py-0.5 rounded text-accent tracking-wider">Attention</span>}
      </div>
      <div>
        <p className={`text-3xl font-bold font-display ${accent ? 'text-accent' : 'text-primary'}`}>{value}</p>
        <p className="text-xs font-medium text-muted mt-1 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, firm } = useAuthStore();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { requests: leaveRequests } = useLeaveStore();
  const { rfis } = useRfiStore();
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  if (!user || !firm || !ready) return <div className="p-8"><div className="animate-pulse h-32 bg-border rounded-xl"></div></div>;

  const firmId = firm.id;
  const isFeatureEnabled = (f: string) => (firm.enabledFeatures || []).includes(f);

  // Data queries
  const activeProjects = projects.filter(p => p.firmId === firmId && p.status === "active");
  const myProjects = activeProjects.filter(p => p.teamLeadId === user.id);
  
  const myTasks = tasks.filter(t => t.firmId === firmId && t.assigneeId === user.id && !["done", "approved"].includes(t.status));
  const myPendingTasks = myTasks.length;
  
  const pendingLeaves = leaveRequests.filter(l => l.firmId === firmId && l.status === "pending").length;
  const openRfis = rfis.filter(r => r.firmId === firmId && r.status === "open").length;

  const renderAdminDashboard = () => (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={activeProjects.length} icon={<FolderKanban size={18} />} />
        <StatCard label="Total Staff" value={0} icon={<Users size={18} />} />
        {isFeatureEnabled("LEAVE") && <StatCard label="Pending Leave" value={pendingLeaves} icon={<CalendarOff size={18} />} accent={pendingLeaves > 0} />}
        {isFeatureEnabled("RFI") && <StatCard label="Open RFIs" value={openRfis} icon={<MessageSquare size={18} />} accent={openRfis > 0} />}
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity size={18}/> Firm Overview</h3>
        <p className="text-sm text-muted">Select a module from the sidebar to manage your firm's operations. You are viewing the platform as an Administrator.</p>
      </div>
    </div>
  );

  const renderTeamLeadDashboard = () => (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="My Projects" value={myProjects.length} icon={<FolderKanban size={18} />} />
        <StatCard label="My Tasks" value={myPendingTasks} icon={<CheckSquare size={18} />} />
        {isFeatureEnabled("RFI") && <StatCard label="Open RFIs" value={openRfis} icon={<MessageSquare size={18} />} accent={openRfis > 0} />}
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckSquare size={18}/> Pending Work</h3>
        {myTasks.length === 0 ? (
          <p className="text-sm text-muted">You have no pending tasks right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {myTasks.slice(0, 5).map(t => (
              <li key={t.id} className="p-3 border border-border rounded-lg text-sm bg-canvas flex justify-between items-center">
                <span className="font-medium text-primary">{t.title}</span>
                <span className="text-xs text-muted bg-surface px-2 py-1 rounded">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderStaffDashboard = () => (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="My Active Tasks" value={myPendingTasks} icon={<CheckSquare size={18} />} accent={myPendingTasks > 0} />
      </div>
      
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CheckSquare size={18}/> My Task Queue</h3>
        {myTasks.length === 0 ? (
          <p className="text-sm text-muted">You are all caught up!</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {myTasks.map(t => (
              <li key={t.id} className="p-3 border border-border rounded-lg text-sm bg-canvas flex justify-between items-center">
                <span className="font-medium text-primary">{t.title}</span>
                <span className="text-xs text-muted bg-surface px-2 py-1 rounded uppercase tracking-wider">{t.priority} priority</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-bold font-display text-primary tracking-tight">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted mt-1">Here's what's happening in your workspace today.</p>
      </header>
      
      {user.role === "admin" && renderAdminDashboard()}
      {user.role === "team_lead" && renderTeamLeadDashboard()}
      {["staff", "accounts"].includes(user.role) && renderStaffDashboard()}
    </div>
  );
}
