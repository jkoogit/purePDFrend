import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/ppdf/components/DocumentLibraryViewer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize CRLF to LF temporarily
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

const targetProps = `interface DocumentLibraryViewerProps {
  userEmail?: string;
  onOpenViewer?: (docId: string, doc?: DocumentItem) => void;
  onRequestShare?: (targetKind: 'file' | 'category', targetName: string, docId?: string) => void;
  isMobileMode?: boolean;
  className?: string;
}

export function DocumentLibraryViewer({
  userEmail = 'jkok2j2m@gmail.com',
  onOpenViewer,
  onRequestShare,
  isMobileMode = false,
  className = '',
}: DocumentLibraryViewerProps) {`;

const replacementProps = `export interface DocumentLibraryViewerProps {
  userEmail?: string;
  onOpenViewer?: (docId: string, doc?: DocumentItem) => void;
  onRequestShare?: (targetKind: 'file' | 'category', targetName: string, docId?: string) => void;
  isMobileMode?: boolean;
  className?: string;
  themeMode?: ThemeMode;
}

export function DocumentLibraryViewer({
  userEmail = 'jkok2j2m@gmail.com',
  onOpenViewer,
  onRequestShare,
  isMobileMode = false,
  className = '',
  themeMode: propThemeMode,
}: DocumentLibraryViewerProps) {
  const [internalThemeMode, setInternalThemeMode] = useState<ThemeMode>(() => {
    if (propThemeMode) return propThemeMode;
    try {
      const saved = localStorage.getItem('purepdfrend_theme_mode');
      if (saved && ['light', 'dark', 'dawn', 'system'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    if (propThemeMode) {
      setInternalThemeMode(propThemeMode);
      return;
    }
    const handleThemeChange = () => {
      try {
        const saved = localStorage.getItem('purepdfrend_theme_mode');
        if (saved && ['light', 'dark', 'dawn', 'system'].includes(saved)) {
          setInternalThemeMode(saved as ThemeMode);
        }
      } catch {}
    };
    window.addEventListener('storage', handleThemeChange);
    const observer = new MutationObserver(() => {
      const domTheme = document.documentElement.getAttribute('data-theme-mode') as ThemeMode;
      if (domTheme && ['light', 'dark', 'dawn', 'system'].includes(domTheme)) {
        setInternalThemeMode(domTheme);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-theme-mode'] });
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      observer.disconnect();
    };
  }, [propThemeMode]);

  const activeThemeMode = propThemeMode || internalThemeMode;
  const resolvedTheme: ResolvedTheme = resolveThemeMode(activeThemeMode);
  const themeClasses = getThemeAdaptiveClasses(resolvedTheme);`;

if (!content.includes(targetProps)) {
  console.error('Target props block not found in DocumentLibraryViewer.tsx');
  process.exit(1);
}

content = content.replace(targetProps, replacementProps);
if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ DocumentLibraryViewerProps & themeClasses declaration updated successfully');
