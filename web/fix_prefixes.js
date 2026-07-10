const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // We want to find cases where a prefix is applied to the light mode class, but missing on the dark mode class.
  // For example: hover:bg-slate-100 dark:bg-white/5 -> hover:bg-slate-100 dark:hover:bg-white/5
  
  const regex = /(hover|group-hover|focus|active):([a-zA-Z0-9-]+)\s+dark:((?!hover|group-hover|focus|active)[a-zA-Z0-9-\/\[\]#]+)/g;
  
  content = content.replace(regex, (match, prefix, lightClass, darkClassPart) => {
    return `${prefix}:${lightClass} dark:${prefix}:${darkClassPart}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Fixed prefixes in " + filePath);
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
console.log('Prefix fix done.');
