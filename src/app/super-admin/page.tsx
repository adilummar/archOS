"use client";
import { useEffect, useState } from "react";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });

  useEffect(() => {
    fetch("/api/v1/platform/firms").then(r => r.json()).then(data => {
      if (data.data) {
        const firms = data.data;
        setStats({
          total: firms.length,
          active: firms.filter((f: any) => f.status === "ACTIVE").length,
          suspended: firms.filter((f: any) => f.status === "SUSPENDED").length,
        });
      }
    });
  }, []);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Platform Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
          <h2 className="text-muted mb-2">Total Firms</h2>
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
        </div>
        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
          <h2 className="text-muted mb-2">Active Firms</h2>
          <p className="text-3xl font-bold text-accent">{stats.active}</p>
        </div>
        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
          <h2 className="text-muted mb-2">Suspended Firms</h2>
          <p className="text-3xl font-bold text-danger">{stats.suspended}</p>
        </div>
      </div>
    </div>
  );
}
