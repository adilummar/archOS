const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/api/v1/onboarding/**/route.ts');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/} catch \(err: any\) {/, `} catch (err: any) {\n    console.error('[Onboarding Error]', err);`);
  fs.writeFileSync(file, content);
});
