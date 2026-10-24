import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/ppdf/components/DocumentLibraryViewer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inputs and Selects in DocumentLibraryViewer
content = content.replace(
  /className="w-full bg-slate-900 border border-slate-700\/80 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"/g,
  'className={`w-full ${themeClasses.input} rounded-lg p-2 ${themeClasses.textMain} focus:outline-none focus:border-sky-500 text-xs min-h-[44px]`}'
);

content = content.replace(
  /className="w-full bg-slate-900 border border-slate-700\/80 rounded-lg p-2 pr-7 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"/g,
  'className={`w-full ${themeClasses.input} rounded-lg p-2 pr-7 ${themeClasses.textMain} focus:outline-none focus:border-sky-500 text-xs min-h-[44px]`}'
);

content = content.replace(
  'className="w-full bg-slate-900 border border-slate-700/80 hover:border-sky-500 rounded-lg p-2 flex items-center justify-between text-slate-200 text-xs cursor-pointer select-none"',
  'className={`w-full ${themeClasses.input} hover:border-sky-500 rounded-lg p-2 flex items-center justify-between ${themeClasses.textMain} text-xs cursor-pointer select-none min-h-[44px]`}'
);

content = content.replace(
  'className="absolute top-full left-0 mt-1 w-full sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-2 animate-in fade-in"',
  'className={`absolute top-full left-0 mt-1 w-full sm:w-80 ${themeClasses.dropdown} border ${themeClasses.border} rounded-xl shadow-2xl p-2 z-50 space-y-2 animate-in fade-in`}'
);

// 2. Buttons in DocumentLibraryViewer
content = content.replace(
  'className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"',
  'className={`p-1.5 rounded-lg ${themeClasses.buttonSecondary} border ${themeClasses.border} transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center`}'
);

// Category collapsed mobile banner
content = content.replace(
  'className={`${isMobileMode ? \'flex\' : \'flex lg:hidden\'} w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 shadow-sm items-center justify-between transition-all cursor-pointer`}',
  'className={`${isMobileMode ? \'flex\' : \'flex lg:hidden\'} w-full ${themeClasses.panel} border ${themeClasses.border} hover:border-slate-500 rounded-2xl p-3 shadow-sm items-center justify-between transition-all cursor-pointer min-h-[44px]`}'
);

content = content.replace(
  '<span className="font-bold text-white text-xs">도서 카테고리</span>',
  '<span className={`font-bold ${themeClasses.textMain} text-xs`}>도서 카테고리</span>'
);

// Desktop collapsed bar
content = content.replace(
  'className="hidden lg:flex flex-col items-center py-4 px-2 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-sm"',
  'className={`hidden lg:flex flex-col items-center py-4 px-2 ${themeClasses.panel} border ${themeClasses.border} rounded-2xl space-y-4 shadow-sm`}'
);

// Tree vs Path switcher
content = content.replace(
  'className="flex rounded-md bg-slate-900 p-0.5 border border-slate-800"',
  'className={`flex rounded-md ${themeClasses.panel} p-0.5 border ${themeClasses.border}`}'
);

// Card list vs Table view
content = content.replace(
  'className="p-3.5 bg-slate-950 border border-slate-800 hover:border-sky-500/60 rounded-2xl space-y-3 cursor-pointer transition-all group select-none shadow-sm flex flex-col justify-between"',
  'className={`p-3.5 ${themeClasses.card} border ${themeClasses.border} hover:border-sky-500/60 rounded-2xl space-y-3 cursor-pointer transition-all group select-none shadow-sm flex flex-col justify-between`}'
);

content = content.replace(
  'className="font-bold text-white text-xs whitespace-nowrap group-hover:text-sky-300 transition-colors"',
  'className={`font-bold ${themeClasses.textMain} text-xs whitespace-nowrap group-hover:text-sky-400 transition-colors`}'
);

content = content.replace(
  'className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"',
  'className={`${themeClasses.container} border ${themeClasses.border} rounded-2xl overflow-hidden shadow-sm`}'
);

content = content.replace(
  'className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono"',
  'className={`${themeClasses.panel} border-b ${themeClasses.border} ${themeClasses.textMuted} font-mono`}'
);

content = content.replace(
  'className="hover:bg-slate-900/50 cursor-pointer transition-colors group"',
  'className={`hover:bg-sky-500/10 cursor-pointer transition-colors group ${themeClasses.textMain}`}'
);

content = content.replace(
  'className="font-bold text-white group-hover:text-sky-300 transition-colors"',
  'className={`font-bold ${themeClasses.textMain} group-hover:text-sky-400 transition-colors`}'
);

// Empty state
content = content.replace(
  'className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3"',
  'className={`p-12 text-center ${themeClasses.panel} border ${themeClasses.border} rounded-2xl space-y-3`}'
);

content = content.replace(
  'className="text-slate-300 font-bold"',
  'className={`${themeClasses.textMain} font-bold`}'
);

// Category items in sidebar
content = content.replace(
  ": 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 text-slate-300'",
  ": `${themeClasses.card} ${themeClasses.border} ${themeClasses.textMain}`"
);

content = content.replace(
  ": 'bg-slate-900/40 hover:bg-slate-900 border-slate-800/80 text-slate-300'",
  ": `${themeClasses.card} ${themeClasses.border} ${themeClasses.textMain}`"
);

// Category count chips
content = content.replace(
  'className="text-[11px] font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"',
  'className={`text-[11px] font-mono font-bold text-sky-400 ${themeClasses.panel} px-2 py-0.5 rounded border ${themeClasses.border}`}'
);

content = content.replace(
  'className="text-[10px] text-slate-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800"',
  'className={`text-[10px] ${themeClasses.textMuted} font-mono ${themeClasses.panel} px-1.5 py-0.5 rounded border ${themeClasses.border}`}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ DocumentLibraryViewer.tsx tokens.ts 전면 대입 완료');
