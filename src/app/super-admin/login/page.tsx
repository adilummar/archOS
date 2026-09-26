"use client";
import { useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useRouter } from "next/navigation";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/super-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      router.push("/super-admin");
    } else {
      setError("Invalid credentials or inactive account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas font-sans">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-surface p-8 rounded-lg shadow-sm border border-border flex flex-col gap-4">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-accent tracking-widest">PLATFORM ADMIN</h1>
        </div>
        {error && <div className="text-danger text-sm text-center bg-danger/10 p-2 rounded">{error}</div>}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted font-medium">Email</label>
          <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted font-medium">Password</label>
          <PasswordInput required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="p-2 border border-border rounded bg-canvas text-primary pr-10" />
        </div>
        <button type="submit" className="mt-4 w-full p-2 bg-accent text-white rounded font-medium hover:bg-accent-muted transition-colors">
          Sign In
        </button>
      
        {/* Quick Login - DEV ONLY */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] text-muted mb-2 text-center uppercase tracking-widest">
            Quick Login (Dev Only)
          </p>
          <button
            type="button"
            onClick={(e) => {
              setEmail("super@archos.com");
              setPassword("supersecret123");
              // Form submit will need to be manually triggered or just call handleLogin
              // To be safe we set state and simulate event or just wait for user to click sign in.
              // We can wrap it in an IIFE.
              e.preventDefault();
              fetch("/api/auth/super-admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "super@archos.com", password: "supersecret123" })
              }).then(res => {
                if (res.ok) router.push("/super-admin");
                else setError("Invalid credentials");
              });
            }}
            className="w-full p-2 bg-canvas border border-border rounded text-xs font-medium text-primary hover:bg-surface transition-colors"
          >
            super@archos.com
          </button>
        </div>
      </form>
    </div>
  );
}
