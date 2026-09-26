const fs = require('fs');
let c = fs.readFileSync('src/app/super-admin/login/page.tsx', 'utf8');

c = c.replace(/<input type="email" required/, `<input type="email" required autoComplete="username"`);
c = c.replace(/<input type="password" required/, `<input type="password" required autoComplete="current-password"`);

const quickLoginHtml = `
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
      </form>`;

c = c.replace(/<\/form>/, quickLoginHtml);

fs.writeFileSync('src/app/super-admin/login/page.tsx', c);
console.log("Patched Super Admin login page");
