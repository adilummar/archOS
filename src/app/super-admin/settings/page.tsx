"use client";
import { useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/v1/platform/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to update password");
    } else {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-surface border border-border p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4 pb-2 border-b border-border">Change Password</h2>
        
        {error && <div className="mb-4 p-3 bg-danger/10 text-danger rounded border border-danger/20 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-500/10 text-green-500 rounded border border-green-500/20 text-sm">Password updated successfully!</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-medium">Current Password</label>
            <input 
              type="password" 
              required 
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="p-2 border border-border rounded bg-canvas text-primary" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-medium">New Password</label>
            <input 
              type="password" 
              required 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="p-2 border border-border rounded bg-canvas text-primary" 
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-medium">Confirm New Password</label>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="p-2 border border-border rounded bg-canvas text-primary" 
            />
          </div>
          <div className="mt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-accent text-white rounded font-medium hover:bg-accent-muted transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
