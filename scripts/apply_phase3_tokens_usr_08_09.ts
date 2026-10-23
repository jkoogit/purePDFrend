import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/ppdf/views/wireframes/UserWireframes.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// ==========================================
// 1. PG-USR-08 (오프라인 작업 정리) 토큰 대입
// ==========================================

// Network status bar
content = content.replace(
  '<span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${',
  '<span className={`text-[10px] px-2 py-0.5 rounded-xl font-mono font-semibold ${\n'
);

content = content.replace(
  'className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"',
  'className={`px-3 py-1.5 min-h-[44px] ${themeClasses.buttonSecondary} rounded-xl text-xs font-semibold border ${themeClasses.border} transition`}'
);

content = content.replace(
  'className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-md transition active:scale-95"',
  'className="px-3.5 py-1.5 min-h-[44px] bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-md transition active:scale-95"'
);

// Search & filter panel
content = content.replace(
  '<div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 shadow-md">',
  '<div className={`p-3.5 ${themeClasses.panel} border ${themeClasses.border} rounded-2xl space-y-2.5 shadow-md`}>'
);

// Filter inputs & selects
content = content.replace(
  'className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"',
  'className={`w-full min-h-[44px] px-2.5 py-1.5 ${themeClasses.input} rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500`}'
);

content = content.replace(
  'className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"',
  'className={`w-full min-h-[44px] px-2.5 py-1.5 ${themeClasses.input} rounded-xl text-xs focus:outline-none focus:border-indigo-500`}'
);

content = content.replace(
  'className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"',
  'className={`w-full min-h-[44px] px-2.5 py-1.5 ${themeClasses.input} rounded-xl text-xs focus:outline-none focus:border-indigo-500`}'
);

content = content.replace(
  'className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"',
  'className={`w-full min-h-[44px] px-2.5 py-1.5 ${themeClasses.input} rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500`}'
);

content = content.replace(
  'className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"',
  'className={`w-full min-h-[44px] py-1.5 ${themeClasses.buttonSecondary} rounded-xl text-xs font-semibold border ${themeClasses.border} transition flex items-center justify-center gap-1.5 cursor-pointer`}'
);

// Document table/card container
content = content.replace(
  '<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 shadow-md">',
  '<div className={`p-4 ${themeClasses.container} border ${themeClasses.border} rounded-2xl space-y-3 shadow-md`}>'
);

content = content.replace(
  '<div className="flex justify-between items-center border-b border-slate-800/80 pb-3">',
  '<div className={`flex justify-between items-center border-b ${themeClasses.border} pb-3`}>'
);

content = content.replace(
  '<span className="font-bold text-slate-200 text-xs flex items-center gap-2">',
  '<span className={`font-bold ${themeClasses.textMain} text-xs flex items-center gap-2`}>'
);

// Mobile card items in PG-USR-08
content = content.replace(
  'className={`p-3.5 bg-slate-900/80 border rounded-xl space-y-2.5 transition shadow-sm ${\n                          doc.hasConflict ? \'border-amber-500/50 bg-amber-950/20\' : \'border-slate-800\'\n                        }`}',
  'className={`p-3.5 ${themeClasses.card} border rounded-xl space-y-2.5 transition shadow-sm ${\n                          doc.hasConflict ? \'border-amber-500/50 bg-amber-950/20\' : themeClasses.border\n                        }`}'
);

content = content.replace(
  '<div className="flex items-start justify-between gap-2 border-t border-slate-800/60 pt-2">',
  '<div className={`flex items-start justify-between gap-2 border-t ${themeClasses.border} pt-2`}>'
);

content = content.replace(
  '<div className="grid grid-cols-1 gap-1 text-[11px] text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40">',
  '<div className={`grid grid-cols-1 gap-1 text-[11px] ${themeClasses.textMuted} font-mono ${themeClasses.panel} p-2.5 rounded-xl border ${themeClasses.border}`}>'
);

// Desktop table in PG-USR-08
content = content.replace(
  '<tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">',
  '<tr className={`border-b ${themeClasses.border} ${themeClasses.textMuted} ${themeClasses.panel}`}>\n'
);

content = content.replace(
  '<tbody className="divide-y divide-slate-800/60">',
  '<tbody className={`divide-y ${themeClasses.border}`}>\n'
);

// Conflict & Hidden annotation modal in PG-USR-08
content = content.replace(
  '<div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">',
  '<div className={`${themeClasses.container} border ${themeClasses.border} rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto`}>'
);

content = content.replace(
  '<div className="flex justify-between items-center pb-3 border-b border-slate-800">',
  '<div className={`flex justify-between items-center pb-3 border-b ${themeClasses.border}`}>'
);

content = content.replace(
  '<div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">',
  '<div className={`p-3 ${themeClasses.panel} border ${themeClasses.border} rounded-xl flex items-center justify-between gap-3`}>'
);

content = content.replace(
  '<div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">',
  '<div className={`p-4 ${themeClasses.panel} border ${themeClasses.border} rounded-xl space-y-2`}>'
);

content = content.replace(
  '<div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 bg-slate-900 rounded-lg border border-slate-800/80">',
  '<div className={`grid grid-cols-2 gap-2 text-[11px] font-mono p-3 ${themeClasses.card} rounded-xl border ${themeClasses.border}`}>'
);

// ==========================================
// 2. PG-USR-09 (정밀 사용자 환경설정) 토큰 대입
// ==========================================

// Tabs bar
content = content.replace(
  '<div className="border-b border-slate-800 pb-2">',
  '<div className={`border-b ${themeClasses.border} pb-2`}>'
);

// Reset button
content = content.replace(
  'className="ml-auto px-3 py-1.5 min-h-[38px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] flex items-center gap-1 font-medium shrink-0"',
  'className="ml-auto px-3 py-1.5 min-h-[44px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-[11px] flex items-center gap-1 font-medium shrink-0"'
);

// Groups tab add form
content = content.replace(
  '<div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">',
  '<div className={`flex items-center gap-2 ${themeClasses.panel} p-1.5 rounded-xl border ${themeClasses.border}`}>\n'
);

content = content.replace(
  'className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"',
  'className={`min-h-[44px] px-2 py-1 rounded-xl text-xs ${themeClasses.input}`}'
);

content = content.replace(
  'className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"',
  'className={`min-h-[44px] px-2 py-1 rounded-xl text-xs ${themeClasses.input}`}'
);

content = content.replace(
  'className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-xs flex items-center gap-1 shadow"',
  'className="px-3 py-1 min-h-[44px] bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium text-xs flex items-center gap-1 shadow"'
);

// 8 groups grid
content = content.replace(
  'className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between"',
  'className={`p-3 ${themeClasses.card} border ${themeClasses.border} rounded-xl space-y-2 flex flex-col justify-between`}'
);

content = content.replace(
  '<div className="flex justify-between items-center pb-1.5 border-b border-slate-800">',
  '<div className={`flex justify-between items-center pb-1.5 border-b ${themeClasses.border}`}>\n'
);

content = content.replace(
  'className="p-1.5 bg-slate-900/90 rounded border border-slate-800 flex items-center justify-between text-[11px]"',
  'className={`p-1.5 ${themeClasses.panel} rounded-xl border ${themeClasses.border} flex items-center justify-between text-[11px]`}'
);

// Shortcuts tab
content = content.replace(
  '<div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">',
  '<div className={`p-3 ${themeClasses.panel} border ${themeClasses.border} rounded-xl flex items-center justify-between`}>\n'
);

content = content.replace(
  'className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between"',
  'className={`p-2.5 ${themeClasses.card} border ${themeClasses.border} rounded-xl flex items-center justify-between`}'
);

content = content.replace(
  'className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-amber-300 text-xs font-bold"',
  'className={`w-24 min-h-[44px] ${themeClasses.input} rounded-xl px-2 py-1 text-center font-mono text-amber-400 text-xs font-bold`}'
);

// General options tab
content = content.replace(
  '<div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">',
  '<div className={`p-4 ${themeClasses.container} border ${themeClasses.border} rounded-xl space-y-3`}>\n'
);

content = content.replace(
  '<div className="flex items-center justify-between pb-2 border-b border-slate-800">',
  '<div className={`flex items-center justify-between pb-2 border-b ${themeClasses.border}`}>\n'
);

content = content.replace(
  'className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center"',
  'className={`p-3 ${themeClasses.card} rounded-xl border ${themeClasses.border} flex justify-between items-center`}'
);

content = content.replace(
  'className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center"',
  'className={`p-3 ${themeClasses.card} rounded-xl border ${themeClasses.border} flex justify-between items-center`}'
);

content = content.replace(
  'className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center"',
  'className={`p-3 ${themeClasses.card} rounded-xl border ${themeClasses.border} flex justify-between items-center`}'
);

content = content.replace(
  'className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center"',
  'className={`p-3 ${themeClasses.card} rounded-xl border ${themeClasses.border} flex justify-between items-center`}'
);

content = content.replace(
  'className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"',
  'className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs ${themeClasses.input}`}'
);

content = content.replace(
  'className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"',
  'className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs ${themeClasses.input}`}'
);

content = content.replace(
  'className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"',
  'className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs ${themeClasses.input}`}'
);

content = content.replace(
  'className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"',
  'className={`min-h-[44px] px-2.5 py-1.5 rounded-xl text-xs ${themeClasses.input}`}'
);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ UserWireframes.tsx (PG-USR-08 & PG-USR-09) tokens.ts 전면 대입 완료!');
