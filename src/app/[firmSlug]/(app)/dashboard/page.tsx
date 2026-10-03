"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, isToday } from "date-fns";
import { CheckSquare, Plus } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useProjectStore } from "@/lib/store/project.store";
import { useTasks } from "@/hooks/useTasks";
import { useTaskStore } from "@/lib/store/task.store";
import { useFirmStore } from "@/lib/store/firm.store";

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
  const router = useRouter();
  const params = useParams<{ firmSlug: string }>();
  const { user, firm } = useAuthStore();
  const { data: tasks = [] } = useTasks(firm?.id || "");
  const { users } = useFirmStore();
  const { projects } = useProjectStore();
  
  const [ready, setReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => { 
    setReady(true); 
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!user || !firm || !ready) return <div className="p-8"><div className="animate-pulse h-32 bg-border rounded-xl"></div></div>;

  const firmId = firm.id;

  // Data queries
  const activeProjects = projects.filter(p => p.firmId === firmId && p.status === "active");
  
  const myTasks = tasks.filter(t => t.firmId === firmId && t.assigneeId === user.id && !["done", "approved"].includes(t.status));
  const myPendingTasks = myTasks.length;

  const firmTasks = tasks.filter(t => t.firmId === firmId);
  const openTasks = firmTasks.filter(t => !["done", "approved"].includes(t.status));
  
  const overdueTasks = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const priorityTasks = openTasks.filter(t => t.priority === "high");
  const reviewTasks = openTasks.filter(t => ["submitted_for_review", "review"].includes(t.status));

  const staffMembers = users.filter(u => u.firmId === firmId && u.status === "active").slice(0, 3);
  const staffStatuses = staffMembers.map((s, idx) => ({
    name: s.name.split(" ")[0],
    statusColor: idx === 0 ? "bg-orange-500" : idx === 1 ? "bg-red-500" : "bg-green-500"
  }));
  
  const deadlinesToday = firmTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).length;
  const approvalsWaiting = reviewTasks.length;
  
  const projectsAtRisk = activeProjects.filter(p => 
    firmTasks.some(t => t.projectId === p.id && t.dueDate && new Date(t.dueDate) < new Date() && !["done", "approved"].includes(t.status))
  ).length;

  const renderStaffDashboard = () => (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto p-4 md:p-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-bold font-display text-primary tracking-tight">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted mt-1">Here's what's happening in your workspace today.</p>
      </header>
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

  // ONLY Admin and Team Lead get the sleek new dashboard
  if (["staff", "accounts"].includes(user.role)) {
    return renderStaffDashboard();
  }

  // Formatting for sleek dashboard
  const timeString = format(currentTime, "h:mma").toLowerCase();
  const dateString = format(currentTime, "dd MMM, eee");
  
  return (
    <div className="w-full h-full min-h-[calc(100vh-60px)] relative overflow-hidden font-sans" style={{ backgroundColor: '#0c0c0c', color: '#f3f4f6' }}>
      
      {/* Background glowing orb */}
      <div 
        className="absolute top-0 right-0 w-[900px] h-[900px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(72,107,82,0.18) 0%, rgba(12,12,12,0) 65%)',
          transform: 'translate(20%, -30%)',
          filter: 'blur(70px)',
          zIndex: 0
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto p-6 md:p-12 flex flex-col gap-16 animate-fade-in">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center gap-8 mt-4">
          <div className="flex flex-col min-w-[200px]">
            <h1 className="text-[2.5rem] font-medium tracking-tight leading-none mb-1">
              {timeString}
            </h1>
            <p className="text-[13px] font-medium opacity-60">
              {dateString}
            </p>
            
            <div className="mt-10">
              <h2 className="text-[15px] font-normal opacity-90">Good Evening,</h2>
              <h2 className="text-[15px] font-medium">{firm.name}</h2>
            </div>
          </div>
          
          <div className="hidden md:block w-[1px] h-28 bg-white/10 mx-2" />
          
          <div className="flex flex-col gap-2.5 text-[13px] font-medium opacity-80 mt-10 md:mt-0 leading-relaxed tracking-wide">
            <p>{deadlinesToday} Deadlines Today Â·</p>
            <p>{approvalsWaiting} Approvals Waiting Â·</p>
            <p>{projectsAtRisk} Project{projectsAtRisk !== 1 ? 's' : ''} at Risk</p>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 auto-rows-[190px]">
          
          {/* Main Empty Card (Left) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-2 rounded-[20px] border border-white/5" style={{ backgroundColor: '#131313' }} />

          {/* Task Card (Middle Top) */}
          <div 
            className="group col-span-1 md:col-span-2 lg:col-span-2 lg:row-span-1 rounded-[20px] border border-white/5 p-5 relative transition-colors hover:bg-white/5 flex flex-col justify-between"
            style={{ backgroundColor: '#474543' }}
          >
            <div className="flex justify-between items-start">
              <div 
                className="cursor-pointer transition-opacity hover:opacity-80" 
                onClick={() => router.push(`/${params.firmSlug}/tasks`)}
              >
                <p className="text-[10px] text-white/60 font-medium tracking-wide">open tasks</p>
                <p className="text-[2rem] font-normal mt-1 leading-none">{openTasks.length}</p>
              </div>
              <p 
                className="text-sm font-medium cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => router.push(`/${params.firmSlug}/tasks`)}
              >
                Task
              </p>
            </div>
            
            <div className="flex justify-between items-end">
              <div 
                onClick={(e) => { e.stopPropagation(); router.push(`/${params.firmSlug}/tasks?filter=overdue`); }}
                className="cursor-pointer transition-opacity hover:opacity-80"
              >
                <p className="text-xl font-normal text-[#ff6a2b] leading-none mb-1">{overdueTasks.length}</p>
                <p className="text-[10px] text-[#ff6a2b] font-medium tracking-wide">overdue tasks</p>
              </div>
              
              <div 
                onClick={(e) => { e.stopPropagation(); router.push(`/${params.firmSlug}/tasks?filter=priority`); }}
                className="cursor-pointer text-right transition-opacity hover:opacity-80"
              >
                <p className="text-xl font-normal text-white leading-none mb-1">{priorityTasks.length}</p>
                <p className="text-[10px] text-white/60 font-medium tracking-wide">priority tasks</p>
              </div>
            </div>
          </div>

          {/* Approval Card (Right Top) */}
          <div 
            onClick={() => router.push(`/${params.firmSlug}/tasks?filter=review`)}
            className="group col-span-1 lg:col-span-1 lg:row-span-1 rounded-[20px] border border-white/5 p-5 relative transition-colors hover:bg-white/5 flex flex-col justify-between cursor-pointer"
            style={{ backgroundColor: '#474543' }}
          >
            <p className="text-sm font-medium text-right text-white/90">Approval</p>
            <p className="text-[2rem] font-normal text-right mt-auto leading-none">{reviewTasks.length}</p>
          </div>

          {/* Start Card (Middle Bottom Left) */}
          <div 
            onClick={() => router.push(`/${params.firmSlug}/tasks`)}
            className="group col-span-1 lg:col-span-1 lg:row-span-1 rounded-[20px] p-5 relative transition-opacity hover:opacity-90 flex items-center justify-center cursor-pointer shadow-lg"
            style={{ backgroundColor: '#40644d' }}
          >
            <div className="flex items-center gap-3 bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-sm shadow-sm transition-transform group-hover:scale-105">
              <span className="font-medium text-sm text-white/90">Start</span>
              <Plus size={16} className="text-white/70" />
            </div>
          </div>

          {/* Project Card (Middle Bottom Right) */}
          <div 
            onClick={() => router.push(`/${params.firmSlug}/projects`)}
            className="group col-span-1 lg:col-span-1 lg:row-span-1 rounded-[20px] border border-white/5 p-5 relative transition-colors hover:bg-white/5 flex flex-col justify-between cursor-pointer"
            style={{ backgroundColor: '#474543' }}
          >
            <div>
              <p className="text-[10px] text-white/60 font-medium tracking-wide">active project</p>
              <p className="text-[2rem] font-normal mt-1 leading-none">{activeProjects.length}</p>
            </div>
            <p className="text-sm font-medium text-white/90">Project</p>
          </div>

          {/* Staff Card (Right Bottom) */}
          <div 
            onClick={() => router.push(`/${params.firmSlug}/staff`)}
            className="group col-span-1 lg:col-span-1 lg:row-span-1 rounded-[20px] border border-white/5 p-5 relative transition-colors hover:bg-white/5 flex flex-col justify-between cursor-pointer"
            style={{ backgroundColor: '#474543' }}
          >
            <div className="flex flex-col gap-[6px] w-full mt-1">
              {staffStatuses.length > 0 ? staffStatuses.map((staff, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 rounded-[4px] px-2.5 py-[6px]">
                  <span className="text-[10px] font-medium text-white/80">{staff.name}</span>
                  <div className={`w-2.5 h-[2px] rounded-full ${staff.statusColor}`} />
                </div>
              )) : (
                <p className="text-[10px] text-white/50 text-center py-2">No staff found</p>
              )}
            </div>
            <p className="text-sm font-medium mt-auto pt-4 text-white/90">Staff</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

