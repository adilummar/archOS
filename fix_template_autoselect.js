const fs = require('fs');
const file = 'src/app/[firmSlug]/(app)/settings/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the activeTemplateId state and the firmTemplates constant and add a useEffect
const old = `  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    templates.find((t) => t.firmId === firm?.id)?.id || null
  );`;

const replacement = `  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    templates.find((t) => t.firmId === firm?.id)?.id || null
  );

  // Auto-select first template when templates load from DB (store starts empty)
  useEffect(() => {
    if (!activeTemplateId) {
      const first = templates.find((t) => t.firmId === firm?.id);
      if (first) setActiveTemplateId(first.id);
    }
  }, [templates, firm?.id]);`;

if (content.includes(old)) {
  content = content.replace(old, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed activeTemplateId auto-select with useEffect');
} else {
  console.log('Could not find exact string to replace');
}
