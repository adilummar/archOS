const fs = require('fs');
const path = require('path');
const storesDir = path.join(__dirname, 'src', 'lib', 'store');
const files = fs.readdirSync(storesDir).filter(f => f.endsWith('.store.ts') && f !== 'toast.store.ts');
files.forEach(file => {
  const filePath = path.join(storesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('persist(')) return;
  if (content.includes('import { immer }')) {
    content = content.replace('import { immer } from "zustand/middleware/immer";', 'import { immer } from "zustand/middleware/immer";\nimport { persist } from "zustand/middleware";');
  } else {
    content = content.replace('import { create } from "zustand";', 'import { create } from "zustand";\nimport { persist } from "zustand/middleware";');
  }
  const match = content.match(/export const use(\w+)Store = create<\w+>\(\)\(/);
  if (match) {
    const storeName = match[1].toLowerCase();
    if (content.includes('immer(')) {
      content = content.replace(/immer\(/, 'persist(\n    immer(');
      const lastIndex = content.lastIndexOf('}))\n);');
      if (lastIndex !== -1) {
        content = content.substring(0, lastIndex) + '})),\n    { name: "archos-' + storeName + '" }\n  )\n);' + content.substring(lastIndex + 5);
      }
    } else {
      console.log('Skipping ' + file);
    }
  }
  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
});
