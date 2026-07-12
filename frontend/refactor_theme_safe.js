const fs = require('fs');
const path = require('path');

function replaceSafe(str, regex, replacement) {
  return str.replace(regex, (match, p1) => {
    if (match.includes("dark:")) return match;
    return replacement;
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Backgrounds
  content = content.replace(/(?<!dark:)\bbg-\[\#0a0c18\]\b/g, "bg-white dark:bg-[#0a0c18]");
  content = content.replace(/(?<!dark:)\bbg-\[\#0f111a\]\b/g, "bg-white dark:bg-[#0f111a]");
  content = content.replace(/(?<!dark:)\bbg-white\/5\b/g, "bg-slate-100 dark:bg-white/5");
  content = content.replace(/(?<!dark:)\bbg-white\/10\b/g, "bg-slate-200 dark:bg-white/10");
  
  // Hover backgrounds
  content = content.replace(/(?<!dark:)\bhover:bg-white\/5\b/g, "hover:bg-slate-100 dark:hover:bg-white/5");
  content = content.replace(/(?<!dark:)\bhover:bg-white\/10\b/g, "hover:bg-slate-200 dark:hover:bg-white/10");

  // Borders
  content = content.replace(/(?<!dark:)\bborder-white\/5\b/g, "border-slate-200 dark:border-white/5");
  content = content.replace(/(?<!dark:)\bborder-white\/10\b/g, "border-slate-200 dark:border-white/10");
  
  // Text
  content = content.replace(/(?<!dark:)\btext-white\b/g, "text-slate-900 dark:text-white");
  content = content.replace(/(?<!dark:)\bhover:text-white\b/g, "hover:text-slate-900 dark:hover:text-white");
  content = content.replace(/(?<!dark:)\btext-slate-200\b/g, "text-slate-800 dark:text-slate-200");
  content = content.replace(/(?<!dark:)\btext-slate-300\b/g, "text-slate-700 dark:text-slate-300");
  content = content.replace(/(?<!dark:)\btext-slate-400\b/g, "text-slate-500 dark:text-slate-400");
  content = content.replace(/(?<!dark:)\btext-indigo-300\b/g, "text-indigo-600 dark:text-indigo-300");
  
  // Specific glass backgrounds
  content = content.replace(/(?<!dark:)\bbg-black\/50\b/g, "bg-black/20 dark:bg-black/50");

  // Deduplicate
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
console.log('Safe refactor done.');
