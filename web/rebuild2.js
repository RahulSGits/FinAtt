const fs = require('fs');

// mock.ts
let mock = fs.readFileSync('src/lib/mock.ts', 'utf8');
mock = mock.replace('export type Status = "present" | "absent" | "late" | "half-day";', 'export type Status = "present" | "absent" | "late" | "half-day" | "pending";');
mock = mock.replace('  absent: "bg-rose-500/10 text-rose-400 border-rose-500/20",', '  absent: "bg-rose-500/10 text-rose-400 border-rose-500/20",\n  pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",');
// Insert scrubbing logic before export const company
mock = mock.replace('export const company = {', `// Scrub future days
const todayDayIndex = (new Date().getDay() + 6) % 7;
employees.forEach(emp => {
  for (let i = todayDayIndex + 1; i < 7; i++) {
    emp.week[i] = "pending";
  }
});

export const company = {`);
fs.writeFileSync('src/lib/mock.ts', mock);

// hr/page.tsx
let hr = fs.readFileSync('src/app/(main)/hr/page.tsx', 'utf8');
hr = hr.replace('{day === "absent" && "A"}', '{day === "absent" && "A"}\n                        {day === "pending" && "-"}');
fs.writeFileSync('src/app/(main)/hr/page.tsx', hr);

// globals.css
let css = fs.readFileSync('src/app/globals.css', 'utf8');
css = css.replace(':root {\n  --bg: #06070f;', `:root {
  --bg: #f8fafc;
  --panel: rgba(255, 255, 255, 0.7);
  --panel-solid: #ffffff;
  --panel-strong: rgba(255, 255, 255, 0.85);
  --border: rgba(0, 0, 0, 0.08);
  --text: #0f172a;
  --muted: #64748b;
  --accent: #4f46e5;
  --accent2: #0ea5e9;
  --accent3: #9333ea;
  --green: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --blue: #3b82f6;
}

.dark {
  --bg: #06070f;`);
css = css.replace('--panel-solid: #0e1020;\n  --border:', '--panel-solid: #0e1020;\n  --panel-strong: rgba(14, 16, 32, 0.75);\n  --border:');
css = css.replace('.glass-strong {\n  background: rgba(14, 16, 32, 0.75);', '.glass-strong {\n  background: var(--panel-strong);');
css = css.replace('::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }\n::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }', '::-webkit-scrollbar-thumb { background: var(--border); border-radius: 8px; }\n::-webkit-scrollbar-thumb:hover { background: var(--muted); }');
css = css.replace('.table-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }', '.table-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }');
css = css.replace('.inline-edit {\n  background: rgba(255,255,255,0.06);', '.inline-edit {\n  background: var(--panel);');
css = css.replace('  width: 340px;', '  width: 340px;\n}\n@media (min-width: 640px) {\n  .notif-dropdown { width: 384px; }');
fs.writeFileSync('src/app/globals.css', css);

console.log("Rebuild part 2 done.");
