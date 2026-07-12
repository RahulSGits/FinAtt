const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /bg-\[\#0a0c18\]/g, replace: "bg-white dark:bg-[#0a0c18]" },
  { search: /bg-\[\#0f111a\]/g, replace: "bg-white dark:bg-[#0f111a]" },
  { search: /border-white\/5/g, replace: "border-slate-200 dark:border-white/5" },
  { search: /border-white\/10/g, replace: "border-slate-200 dark:border-white/10" },
  { search: /(?<!dark:)bg-white\/5(?!0)/g, replace: "bg-black/5 dark:bg-white/5" },
  { search: /(?<!dark:)bg-white\/10/g, replace: "bg-black/10 dark:bg-white/10" },
  { search: /(?<!dark:)hover:bg-white\/5(?!0)/g, replace: "hover:bg-black/5 dark:hover:bg-white/5" },
  { search: /(?<!dark:)hover:bg-white\/10/g, replace: "hover:bg-black/10 dark:hover:bg-white/10" },
  { search: /(?<!dark:)text-white/g, replace: "text-slate-900 dark:text-white" },
  { search: /(?<!dark:)text-slate-200/g, replace: "text-slate-800 dark:text-slate-200" },
  { search: /(?<!dark:)text-slate-300/g, replace: "text-slate-700 dark:text-slate-300" },
  { search: /(?<!dark:)text-slate-400/g, replace: "text-slate-500 dark:text-slate-400" },
  { search: /(?<!dark:)hover:text-white/g, replace: "hover:text-slate-900 dark:hover:text-white" },
  { search: /(?<!dark:)bg-black\/60/g, replace: "bg-black/20 dark:bg-black/60" },
  { search: /glass-strong/g, replace: "glass-strong dark:glass-strong" } // Wait, glass-strong uses var(--panel-strong) so it's already responsive.
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  for (const { search, replace } of replacements) {
    content = content.replace(search, replace);
  }

  // Deduplicate any accidental double darks, e.g. dark:dark:text-white
  content = content.replace(/dark:dark:/g, "dark:");
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done');
