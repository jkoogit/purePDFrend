import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/ppdf/views/wireframes/UserWireframes.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. PG-USR-06 2-row toolbar container
content = content.replace(
  '<div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-visible relative">',
  '<div className={`${themeClasses.container} border ${themeClasses.border} rounded-2xl shadow-xl overflow-visible relative`}>'
);

content = content.replace(
  '<div className="h-10 px-2.5 sm:px-3 border-b border-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2">',
  '<div className={`h-10 px-2.5 sm:px-3 border-b ${themeClasses.border} flex items-center justify-between gap-1.5 sm:gap-2`}>'
);

content = content.replace(
  'className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"',
  'className={`p-1.5 rounded-lg ${themeClasses.buttonSecondary} border ${themeClasses.border} transition-colors cursor-pointer shrink-0`}'
);

content = content.replace(
  'className="text-xs font-bold text-slate-300 truncate cursor-default whitespace-nowrap inline-block"',
  'className={`text-xs font-bold ${themeClasses.textMain} truncate cursor-default whitespace-nowrap inline-block`}'
);

content = content.replace(
  'className="p-1.5 rounded-lg bg-slate-900 hover:bg-sky-600/30 text-slate-300 hover:text-sky-300 border border-slate-700/80 transition-all cursor-pointer"',
  'className={`p-1.5 rounded-lg ${themeClasses.buttonSecondary} border ${themeClasses.border} transition-all cursor-pointer`}'
);

content = content.replace(
  'className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"',
  'className={`px-2.5 py-1 rounded-lg ${themeClasses.buttonSecondary} border ${themeClasses.border} text-xs font-bold ${themeClasses.textMain} flex items-center gap-1.5 transition-all cursor-pointer shadow-xs`}'
);

// 2. PG-USR-06 3-tab drawer
content = content.replace(
  '<div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-md">',
  '<div className={`${themeClasses.panel} border ${themeClasses.border} rounded-xl p-3 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-md`}>'
);

content = content.replace(
  '<div className="border-b border-slate-800 pb-2 space-y-2 md:space-y-0 md:flex md:items-center md:justify-between">',
  '<div className={`border-b ${themeClasses.border} pb-2 space-y-2 md:space-y-0 md:flex md:items-center md:justify-between`}>'
);

content = content.replace(
  '<div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]">',
  '<div className={`flex items-center gap-1 ${themeClasses.card} px-2 py-0.5 rounded-lg border ${themeClasses.border} text-[10px]`}>'
);

content = content.replace(
  'className="bg-slate-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-slate-200 font-medium cursor-pointer"',
  'className={`${themeClasses.input} rounded px-1.5 py-0.5 ${themeClasses.textMain} font-medium cursor-pointer`}'
);

// 3. PG-USR-06 Virtual canvas area
content = content.replace(
  'className={`flex-1 bg-slate-950 border border-slate-800 rounded-xl ${isViewerFullscreen ? \'p-1.5 sm:p-2.5 h-full\' : \'p-3\'} flex flex-col justify-between relative overflow-hidden shadow-inner min-w-0`}',
  'className={`flex-1 ${themeClasses.container} border ${themeClasses.border} rounded-xl ${isViewerFullscreen ? \'p-1.5 sm:p-2.5 h-full\' : \'p-3\'} flex flex-col justify-between relative overflow-hidden shadow-inner min-w-0`}'
);

content = content.replace(
  '<div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs mb-2 transition-all animate-in fade-in duration-100">',
  '<div className={`flex flex-wrap items-center justify-between gap-2 p-2 ${themeClasses.panel} border ${themeClasses.border} rounded-lg text-xs mb-2 transition-all animate-in fade-in duration-100`}>'
);

content = content.replace(
  'className={`flex-1 bg-slate-900/60 rounded-xl p-4 overflow-auto flex items-center justify-center min-h-[380px] relative ${',
  'className={`flex-1 ${themeClasses.panel} border ${themeClasses.border} rounded-xl p-4 overflow-auto flex items-center justify-center min-h-[380px] relative ${'
);

content = content.replace(
  'className="absolute top-10 left-0 z-40 w-64 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100 text-xs"',
  'className={`absolute top-10 left-0 z-40 w-64 p-3 rounded-2xl ${themeClasses.dropdown} border ${themeClasses.border} shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100 text-xs`}'
);

content = content.replace(
  'className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center text-white font-mono"',
  'className={`w-16 px-2 py-1 ${themeClasses.input} rounded text-center ${themeClasses.textMain} font-mono`}'
);

// 4. PG-USR-07 Document share & collaboration dashboard
content = content.replace(
  '<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-3">',
  '<div className={`p-4 ${themeClasses.container} border ${themeClasses.border} rounded-2xl shadow-xl space-y-3`}>'
);

content = content.replace(
  '<h3 className="font-bold text-white text-base">문서공유 및 협업작업 관리 센터</h3>',
  '<h3 className={`font-bold ${themeClasses.textMain} text-base`}>문서공유 및 협업작업 관리 센터</h3>'
);

content = content.replace(
  '<p className="text-[11px] text-slate-400 mt-1">',
  '<p className={`text-[11px] ${themeClasses.textMuted} mt-1`}>'
);

content = content.replace(
  '<div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">',
  '<div className={`p-3 ${themeClasses.panel} border ${themeClasses.border} rounded-xl space-y-2`}>'
);

content = content.replace(
  /<div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-\[11px\]">/g,
  '<div className={`flex items-center gap-1 ${themeClasses.card} px-2 py-1 rounded-lg border ${themeClasses.border} text-[11px]`}>'
);

content = content.replace(
  '<div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">',
  '<div className={`p-8 ${themeClasses.panel} border ${themeClasses.border} rounded-2xl text-center space-y-2`}>'
);

content = content.replace(
  '<p className="text-slate-300 font-bold text-sm">조건과 일치하는 공유 문서가 없습니다.</p>',
  '<p className={`font-bold text-sm ${themeClasses.textMain}`}>조건과 일치하는 공유 문서가 없습니다.</p>'
);

content = content.replace(
  '<h4 className="font-bold text-white text-sm hover:text-sky-300 transition-colors">',
  '<h4 className={`font-bold ${themeClasses.textMain} text-sm hover:text-sky-400 transition-colors`}>'
);

content = content.replace(
  'className={`p-3.5 bg-slate-950 border rounded-xl transition-all ${',
  'className={`p-3.5 ${themeClasses.card} border rounded-xl transition-all ${'
);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ UserWireframes.tsx (PG-USR-06, PG-USR-07) tokens.ts 전면 대입 완료');
