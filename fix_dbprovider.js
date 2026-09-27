const fs = require('fs');
const file = 'src/components/providers/DBProvider.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the two redirect lines - they cause false logouts when revalidatePath runs
const old1 = `          } else {\n            window.location.href = '/' + firmSlug + '/login';\n          }\n        } else {\n          window.location.href = '/' + firmSlug + '/login';\n        }`;
const new1 = `          } else {
            // No user in session — middleware handles redirect on next navigation.
            console.warn("[DBProvider] /api/auth/me returned no user.");
          }
        } else {
          // Fetch failed — middleware handles redirect on next navigation.
          console.warn("[DBProvider] /api/auth/me failed:", authRes.status);
        }`;

if (content.includes(old1)) {
  content = content.replace(old1, new1);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed DBProvider - removed false logout redirects');
} else {
  console.log('Could not find exact string. Trying regex...');
  const regex = /\} else \{\s*window\.location\.href = '\/'\s*\+ firmSlug \+ '\/login';\s*\}\s*\} else \{\s*window\.location\.href = '\/'\s*\+ firmSlug \+ '\/login';\s*\}/;
  if (regex.test(content)) {
    content = content.replace(regex, `} else {
            console.warn("[DBProvider] /api/auth/me returned no user.");
          }
        } else {
          console.warn("[DBProvider] /api/auth/me failed.");
        }`);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed DBProvider with regex');
  } else {
    console.log('Regex also did not match. Showing relevant section:');
    const lines = content.split('\n');
    const idx = lines.findIndex(l => l.includes('window.location.href'));
    if (idx !== -1) console.log(lines.slice(idx - 3, idx + 5).join('\n'));
  }
}
