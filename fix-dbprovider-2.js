const fs = require('fs');
let file = 'src/components/providers/DBProvider.tsx';
let content = fs.readFileSync(file, 'utf-8');

const replacement = `
    useEffect(() => {
      async function loadFromDB() {
        try {
          const firm = await getFirmBySlug(firmSlug);
          if (!firm) return;
  
          // Minimal firm store hydration
          useFirmStore.setState((firmState) => {
            firmState.users = [];
            firmState.clients = [];
            firmState.contractors = [];
            firmState.templates = [];
          });

          // Authenticate
          const authRes = await fetch('/api/v1/auth/me');
          if (authRes.ok) {
            const { user } = await authRes.json();
            if (user) {
              const authState = useAuthStore.getState();
              authState.login(
                {
                  id: user.id,
                  email: user.email,
                  name: user.name || "",
                  role: user.role,
                  firmId: user.firmId || "",
                  status: user.status,
                },
                {
                  id: firm.id,
                  name: firm.name,
                  slug: firm.slug,
                  type: firm.type as any,
                  createdAt: firm.createdAt.toISOString(),
                  onboardingState: firm.onboardingState,
                  enabledFeatures: firm.enabledFeatures || [],
                  tier: firm.tier,
                }
              );
            }
          }
        } catch (e) {
          console.error("DB Load Error:", e);
        }
      }
      loadFromDB();
    }, [firmSlug]);
`;

content = content.replace(/useEffect\(\(\) => \{\n\s*async function loadFromDB\(\) \{[\s\S]*?loadFromDB\(\);\n\s*\}, \[firmSlug\]\);/, replacement.trim());
fs.writeFileSync(file, content);
