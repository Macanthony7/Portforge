const fs = require('fs');
const path = require('path');

const srcDir = 'src';

function walk(dir, exts, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full, exts, files);
    } else if (exts.some(ext => full.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const knownPairs = [
  ['text-slate-900 dark:text-white', 'text-white'],
  ['text-gray-500 dark:text-white/40', 'text-white/40'],
  ['text-gray-400 dark:text-white/30', 'text-white/30'],
  ['text-gray-600 dark:text-white/60', 'text-white/60'],
  ['text-gray-800 dark:text-white/80', 'text-white/80'],
  ['text-gray-300 dark:text-white/20', 'text-white/20'],
  ['text-gray-700 dark:text-white/80', 'text-white/80'],
  ['bg-white dark:bg-forge-black', 'bg-forge-black'],
  ['bg-gray-50 dark:bg-white/5', 'bg-white/5'],
  ['bg-gray-100 dark:bg-white/10', 'bg-white/10'],
  ['bg-red-50 dark:bg-red-950/30', 'bg-red-950/30'],
  ['bg-emerald-50 dark:bg-emerald-950/30', 'bg-emerald-950/30'],
  ['bg-blue-50 dark:bg-blue-950/30', 'bg-blue-950/30'],
  ['bg-orange-100 dark:bg-orange-500/20', 'bg-orange-500/20'],
  ['bg-yellow-100 dark:bg-yellow-500/20', 'bg-yellow-500/20'],
  ['bg-blue-100 dark:bg-blue-500/20', 'bg-blue-500/20'],
  ['bg-red-100 dark:bg-red-500/20', 'bg-red-500/20'],
  ['bg-gray-100 dark:bg-slate-800', 'bg-slate-800'],
  ['border-gray-200 dark:border-white/5', 'border-white/5'],
  ['border-gray-200 dark:border-white/10', 'border-white/10'],
  ['border-gray-300 dark:border-white/20', 'border-white/20'],
  ['border-gray-100 dark:border-white/5', 'border-white/5'],
  ['border-gray-200 dark:border-slate-800', 'border-slate-800'],
  ['hover:text-slate-900 dark:hover:text-white', 'hover:text-white'],
  ['hover:text-slate-800 dark:hover:text-white/60', 'hover:text-white/60'],
  ['hover:text-white dark:hover:text-white', 'hover:text-white'],
  ['hover:bg-gray-100 dark:hover:bg-white/10', 'hover:bg-white/10'],
  ['hover:bg-gray-200 dark:hover:bg-white/20', 'hover:bg-white/20'],
  ['hover:border-gray-300 dark:hover:border-white/20', 'hover:border-white/20'],
  ['placeholder:text-gray-400 dark:placeholder:text-white/30', 'placeholder:text-white/30'],
  ['placeholder:text-gray-300 dark:placeholder:text-white/20', 'placeholder:text-white/20'],
  ['text-gray-400 dark:text-white/40', 'text-white/40'],
  ['text-white/70 dark:text-white/70', 'text-white/70'],
  ['text-slate-900 dark:text-white', 'text-white'],
  ['bg-white dark:bg-gray-50', 'bg-gray-50'],
  ['bg-white/70 dark:bg-slate-900/70', 'bg-slate-900/70'],
  ['border-white/10 dark:border-white/10', 'border-white/10'],
  ['bg-gray-50 dark:bg-[#0A0A0F]', 'bg-[#0A0A0F]'],
  ['bg-gray-50 dark:bg-[#050507]', 'bg-[#050507]'],
  ['dark:bg-white/5 bg-white/10', 'bg-white/5'],
  ['text-red-600 dark:text-red-400', 'text-red-400'],
  ['text-emerald-600 dark:text-emerald-400', 'text-emerald-400'],
  ['text-blue-600 dark:text-blue-400', 'text-blue-400'],
  ['text-red-400 dark:text-red-400', 'text-red-400'],
  ['border-red-300 dark:border-red-500/30', 'border-red-500/30'],
  ['border-orange-300 dark:border-orange-500/30', 'border-orange-500/30'],
  ['border-yellow-300 dark:border-yellow-500/30', 'border-yellow-500/30'],
  ['border-blue-300 dark:border-blue-500/30', 'border-blue-500/30'],
  ['border-gray-300 dark:border-gray-500/30', 'border-gray-500/30'],
];

const files = walk(srcDir, ['.tsx', '.ts', '.css', '.mdx']);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  knownPairs.forEach(([from, to]) => {
    content = content.split(from).join(to);
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
  }
}
