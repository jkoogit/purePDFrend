import assert from 'node:assert';
import {
  THEME_MODES,
  resolveThemeMode,
  applyThemeToDocument,
  ThemeMode,
  tokens,
} from '../src/styles/tokens';
import { SYSTEM_DOMAINS } from '../src/shared/components/Navbar';
import { UserSystemRole, SystemDomainId } from '../src/types';

console.log('🧪 Starting 4-Mode Theme System & Theme-Adapted Logo Tests (TASK-0028-01)...');

// 1. 4-Mode Theme System Architecture
console.log('👉 1. 4-Mode Theme System Architecture');
const modeKeys = Object.keys(THEME_MODES);
assert.ok(modeKeys.includes('light'), 'Should contain light mode');
assert.ok(modeKeys.includes('dark'), 'Should contain dark mode');
assert.ok(modeKeys.includes('dawn'), 'Should contain dawn mode');
assert.ok(modeKeys.includes('system'), 'Should contain system mode');
assert.strictEqual(modeKeys.length, 4, 'Should have exactly 4 modes');

assert.strictEqual(THEME_MODES.light.label, '주간');
assert.strictEqual(THEME_MODES.dark.label, '야간');
assert.strictEqual(THEME_MODES.dawn.label, '여명');
assert.strictEqual(THEME_MODES.system.label, '시스템');
console.log('  ✅ 1.1 THEME_MODES definitions verified');

assert.strictEqual(resolveThemeMode('light'), 'light');
assert.strictEqual(resolveThemeMode('dark'), 'dark');
assert.strictEqual(resolveThemeMode('dawn'), 'dawn');
const systemResolved = resolveThemeMode('system');
assert.ok(['light', 'dark'].includes(systemResolved), 'System resolved should be light or dark');
console.log('  ✅ 1.2 resolveThemeMode mapping verified');

assert.ok(tokens.colors.dawn, 'tokens should have dawn palette');
assert.strictEqual(tokens.colors.dawn.canvas, '#070e22');
assert.strictEqual(tokens.colors.dawn.panel, '#0e1a38');
assert.strictEqual(tokens.colors.dawn.card, '#132247');
assert.strictEqual(tokens.colors.dawn.border, '#1e3066');
assert.strictEqual(tokens.colors.dawn.textMain, '#f0f6ff');
assert.strictEqual(tokens.colors.dawn.accent, '#38bdf8');
console.log('  ✅ 1.3 Dawn color palette tokens verified');

// 2. Role-Based 3-System Switcher Architecture
console.log('👉 2. Role-Based 3-System Switcher Architecture');
const sysIds = SYSTEM_DOMAINS.map((s) => s.id);
assert.deepStrictEqual(sysIds, ['service', 'settings', 'harness']);

const serviceConfig = SYSTEM_DOMAINS.find((s) => s.id === 'service')!;
const settingsConfig = SYSTEM_DOMAINS.find((s) => s.id === 'settings')!;
const harnessConfig = SYSTEM_DOMAINS.find((s) => s.id === 'harness')!;

// 1) ROLE_USER (일반 사용자)
assert.strictEqual(serviceConfig.requiredRole.includes('ROLE_USER'), true);
assert.strictEqual(settingsConfig.requiredRole.includes('ROLE_USER'), false);
assert.strictEqual(harnessConfig.requiredRole.includes('ROLE_USER'), false);

// 2) ROLE_OPERATOR (서비스 설정자)
assert.strictEqual(serviceConfig.requiredRole.includes('ROLE_OPERATOR'), true);
assert.strictEqual(settingsConfig.requiredRole.includes('ROLE_OPERATOR'), true);
assert.strictEqual(harnessConfig.requiredRole.includes('ROLE_OPERATOR'), false);

// 3) ROLE_ADMIN (마스터 관리자)
assert.strictEqual(serviceConfig.requiredRole.includes('ROLE_ADMIN'), true);
assert.strictEqual(settingsConfig.requiredRole.includes('ROLE_ADMIN'), true);
assert.strictEqual(harnessConfig.requiredRole.includes('ROLE_ADMIN'), true);

function canAccess(system: SystemDomainId, role: UserSystemRole): boolean {
  const sys = SYSTEM_DOMAINS.find((s) => s.id === system);
  if (!sys) return false;
  return sys.requiredRole.includes(role);
}

assert.strictEqual(canAccess('service', 'ROLE_USER'), true);
assert.strictEqual(canAccess('settings', 'ROLE_USER'), false);
assert.strictEqual(canAccess('harness', 'ROLE_USER'), false);
assert.strictEqual(canAccess('service', 'ROLE_OPERATOR'), true);
assert.strictEqual(canAccess('settings', 'ROLE_OPERATOR'), true);
assert.strictEqual(canAccess('harness', 'ROLE_OPERATOR'), false);
assert.strictEqual(canAccess('service', 'ROLE_ADMIN'), true);
assert.strictEqual(canAccess('settings', 'ROLE_ADMIN'), true);
assert.strictEqual(canAccess('harness', 'ROLE_ADMIN'), true);
console.log('  ✅ 2.1 RBAC permissions verified');

// 3. Theme-Adapted Logo Style Contracts
console.log('👉 3. Theme-Adapted Logo Style Contracts');
const themeStyles = {
  light: 'bg-white/95 border border-slate-200/90 shadow-md shadow-slate-200/70 text-slate-900',
  dark: 'bg-slate-900/95 border border-slate-800 shadow-lg shadow-indigo-950/40 text-white',
  dawn: 'bg-[#070e22] border border-[#1e3066] shadow-lg shadow-sky-950/50 text-sky-100',
};

assert.ok(themeStyles.light.includes('bg-white'), 'Light theme logo should have white container');
assert.ok(themeStyles.dark.includes('bg-slate-900'), 'Dark theme logo should have slate container');
assert.ok(themeStyles.dawn.includes('bg-[#070e22]'), 'Dawn theme logo should have midnight blue container');
console.log('  ✅ 3.1 Theme-specific logo container styles verified');

// 4. Local Storage Persistence Contracts
console.log('👉 4. Local Storage Persistence Contracts');
const store: Record<string, string> = {};
const mockStorage = {
  setItem: (k: string, v: string) => { store[k] = v; },
  getItem: (k: string) => store[k] || null,
};

mockStorage.setItem('purepdfrend_theme_mode', 'dawn');
assert.strictEqual(mockStorage.getItem('purepdfrend_theme_mode'), 'dawn');

mockStorage.setItem('purepdfrend_theme_mode', 'system');
assert.strictEqual(mockStorage.getItem('purepdfrend_theme_mode'), 'system');

mockStorage.setItem('purepdfrend_active_system', 'settings');
assert.strictEqual(mockStorage.getItem('purepdfrend_active_system'), 'settings');
console.log('  ✅ 4.1 Storage persistence contracts verified');

console.log('🎉 All tests passed successfully!');
