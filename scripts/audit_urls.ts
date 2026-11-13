import fs from 'fs';
import path from 'path';

function findFiles(dir: string, exts: string[]): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(findFiles(full, exts));
    } else if (exts.some(e => full.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

const allCode = findFiles('./app', ['.tsx', '.ts']).concat(findFiles('./components', ['.tsx', '.ts']));
const hrefs = new Set<string>();
const regex = /href=['"]([^'"]+)['"]/g;
for (const file of allCode) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    hrefs.add(match[1]);
  }
}
console.log('Unique hrefs in codebase:');
console.log(Array.from(hrefs).sort());

