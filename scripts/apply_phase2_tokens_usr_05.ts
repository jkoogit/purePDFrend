import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/ppdf/components/DocumentLibraryViewer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add tokens import
if (!content.includes("from '../../styles/tokens'")) {
  const importStatement = `import {\n  ThemeMode,\n  ResolvedTheme,\n  resolveThemeMode,\n  getThemeAdaptiveClasses,\n  tokenClassMap,\n} from '../../styles/tokens';\n`;
  content = content.replace("import { ImageEditLayerModal", `${importStatement}import { ImageEditLayerModal`);
}

// 2. Add themeMode to DocumentLibraryViewerProps
if (!content.includes('themeMode?: ThemeMode;')) {
  content = content.replace(
    '  isMobileMode?: boolean;\n  className?: string;\n}',
    '  isMobileMode?: boolean;\n  className?: string;\n  themeMode?: ThemeMode;\n}'
  );
}

// 3. Destructure and setup theme hook in DocumentLibraryViewer
const oldSignature = `export function DocumentLibraryViewer({\n  userEmail = 'jkok2j2m@gmail.com',\n  onOpenViewer,\n  onRequestShare,\n  isMobileMode = false,\n  className = '',\n}: DocumentLibraryViewerProps) {`;

const newSignature = `export function DocumentLibraryViewer({\n  userEmail = 'jkok2j2m@gmail.com',\n  onOpenViewer,\n  onRequestShare,\n  isMobileMode = false,\n  className = '',\n  themeMode: propThemeMode,\n}: DocumentLibraryViewerProps) {\n  const [internalThemeMode, setInternalThemeMode] = useState<ThemeMode>(() => {\n    if (propThemeMode) return propThemeMode;\n    try {\n      const saved = localStorage.getItem('purepdfrend_theme_mode');\n      if (saved && ['light', 'dark', 'dawn', 'system'].includes(saved)) {\n        return saved as ThemeMode;\n      }\n    } catch {}\n    return 'dark';\n  });\n\n  useEffect(() => {\n    if (propThemeMode) {\n      setInternalThemeMode(propThemeMode);\n      return;\n    }\n    const handleThemeChange = () => {\n      try {\n        const saved = localStorage.getItem('purepdfrend_theme_mode');\n        if (saved && ['light', 'dark', 'dawn', 'system'].includes(saved)) {\n          setInternalThemeMode(saved as ThemeMode);\n        }\n      } catch {}\n    };\n    window.addEventListener('storage', handleThemeChange);\n    const observer = new MutationObserver(() => {\n      const domTheme = document.documentElement.getAttribute('data-theme-mode') as ThemeMode;\n      if (domTheme && ['light', 'dark', 'dawn', 'system'].includes(domTheme)) {\n        setInternalThemeMode(domTheme);\n      }\n    });\n    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-theme-mode'] });\n    return () => {\n      window.removeEventListener('storage', handleThemeChange);\n      observer.disconnect();\n    };\n  }, [propThemeMode]);\n\n  const activeThemeMode = propThemeMode || internalThemeMode;\n  const resolvedTheme: ResolvedTheme = resolveThemeMode(activeThemeMode);\n  const themeClasses = getThemeAdaptiveClasses(resolvedTheme);`;

if (content.includes(oldSignature)) {
  content = content.replace(oldSignature, newSignature);
}

// 4. Transform hardcoded container styles in DocumentLibraryViewer
// Filter box
content = content.replace(
  'className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm mb-5 space-y-3"',
  'className={`p-4 ${themeClasses.container} border ${themeClasses.border} rounded-2xl shadow-sm mb-5 space-y-3`}'
);

content = content.replace(
  'className="text-sm font-bold text-white tracking-tight"',
  'className={`text-sm font-bold ${themeClasses.textMain} tracking-tight`}'
);

// Category container
content = content.replace(
  'className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-3"',
  'className={`${themeClasses.panel} border ${themeClasses.border} rounded-2xl p-3.5 shadow-sm space-y-3`}'
);

// Category header border
content = content.replace(
  'className="flex items-center justify-between border-b border-slate-800/80 pb-2.5"',
  'className={`flex items-center justify-between border-b ${themeClasses.border} pb-2.5`}'
);

// Right panel action bar
content = content.replace(
  'className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm"',
  'className={`flex flex-wrap items-center justify-between gap-3 p-3 ${themeClasses.container} border ${themeClasses.border} rounded-2xl shadow-sm`}'
);

// PDF upload modal
content = content.replace(
  'className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in"',
  'className={`${themeClasses.container} border ${themeClasses.border} rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in`}'
);

// Image to PDF modal
content = content.replace(
  'className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl animate-in fade-in scrollbar-thin"',
  'className={`${themeClasses.container} border ${themeClasses.border} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl animate-in fade-in scrollbar-thin`}'
);

// Category edit modal
content = content.replace(
  'className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in fade-in"',
  'className={`${themeClasses.container} border ${themeClasses.border} rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in fade-in`}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ DocumentLibraryViewer.tsx tokens.ts 1차 대입 완료');
