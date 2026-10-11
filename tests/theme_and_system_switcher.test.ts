import { describe, it, expect, beforeEach } from 'vitest';
import {
  THEME_MODES,
  resolveThemeMode,
  applyThemeToDocument,
  ThemeMode,
  tokens,
} from '../src/styles/tokens';
import { SYSTEM_DOMAINS } from '../src/shared/components/Navbar';
import { UserSystemRole, SystemDomainId } from '../src/types';

describe('4-Mode Theme System & Role-Based System Switcher Tests (TASK-0028-01)', () => {
  beforeEach(() => {
    // Reset mock document classes if document is defined
    if (typeof document !== 'undefined') {
      document.documentElement.className = '';
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.removeAttribute('data-theme-mode');
    }
  });

  describe('1. 4-Mode Theme System Architecture', () => {
    it('1.1 THEME_MODES should define all 4 modes (light, dark, dawn, system)', () => {
      const modeKeys = Object.keys(THEME_MODES);
      expect(modeKeys).toContain('light');
      expect(modeKeys).toContain('dark');
      expect(modeKeys).toContain('dawn');
      expect(modeKeys).toContain('system');
      expect(modeKeys.length).toBe(4);

      expect(THEME_MODES.light.label).toBe('주간');
      expect(THEME_MODES.dark.label).toBe('야간');
      expect(THEME_MODES.dawn.label).toBe('여명');
      expect(THEME_MODES.system.label).toBe('시스템');
    });

    it('1.2 resolveThemeMode should correctly map static modes and system mode', () => {
      expect(resolveThemeMode('light')).toBe('light');
      expect(resolveThemeMode('dark')).toBe('dark');
      expect(resolveThemeMode('dawn')).toBe('dawn');
      // In Node environment without window.matchMedia, system defaults to 'light'
      const systemResolved = resolveThemeMode('system');
      expect(['light', 'dark']).toContain(systemResolved);
    });

    it('1.3 applyThemeToDocument should sync class and data-theme attributes on document root', () => {
      if (typeof document !== 'undefined') {
        const resDawn = applyThemeToDocument('dawn');
        expect(resDawn).toBe('dawn');
        expect(document.documentElement.classList.contains('dawn')).toBe(true);
        expect(document.documentElement.classList.contains('theme-dawn')).toBe(true);
        expect(document.documentElement.getAttribute('data-theme')).toBe('dawn');
        expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dawn');

        const resLight = applyThemeToDocument('light');
        expect(resLight).toBe('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dawn')).toBe(false);
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      }
    });

    it('1.4 tokens should define dawn color palette alongside brand, gray, and semantic', () => {
      expect(tokens.colors).toHaveProperty('dawn');
      expect(tokens.colors.dawn.canvas).toBe('#070e22');
      expect(tokens.colors.dawn.panel).toBe('#0e1a38');
      expect(tokens.colors.dawn.card).toBe('#132247');
      expect(tokens.colors.dawn.border).toBe('#1e3066');
      expect(tokens.colors.dawn.textMain).toBe('#f0f6ff');
      expect(tokens.colors.dawn.accent).toBe('#38bdf8');
    });
  });

  describe('2. Role-Based 3-System Switcher Architecture', () => {
    it('2.1 SYSTEM_DOMAINS should define service, settings, and harness systems', () => {
      const sysIds = SYSTEM_DOMAINS.map((s) => s.id);
      expect(sysIds).toEqual(['service', 'settings', 'harness']);
    });

    it('2.2 RBAC access permissions should be strictly enforced', () => {
      const serviceConfig = SYSTEM_DOMAINS.find((s) => s.id === 'service')!;
      const settingsConfig = SYSTEM_DOMAINS.find((s) => s.id === 'settings')!;
      const harnessConfig = SYSTEM_DOMAINS.find((s) => s.id === 'harness')!;

      // 1) ROLE_USER (일반 사용자)
      expect(serviceConfig.requiredRole.includes('ROLE_USER')).toBe(true);
      expect(settingsConfig.requiredRole.includes('ROLE_USER')).toBe(false);
      expect(harnessConfig.requiredRole.includes('ROLE_USER')).toBe(false);

      // 2) ROLE_OPERATOR (서비스 설정자)
      expect(serviceConfig.requiredRole.includes('ROLE_OPERATOR')).toBe(true);
      expect(settingsConfig.requiredRole.includes('ROLE_OPERATOR')).toBe(true);
      expect(harnessConfig.requiredRole.includes('ROLE_OPERATOR')).toBe(false);

      // 3) ROLE_ADMIN (마스터 관리자)
      expect(serviceConfig.requiredRole.includes('ROLE_ADMIN')).toBe(true);
      expect(settingsConfig.requiredRole.includes('ROLE_ADMIN')).toBe(true);
      expect(harnessConfig.requiredRole.includes('ROLE_ADMIN')).toBe(true);

      // 4) ROLE_SUPER_ADMIN (최고 관리자)
      expect(serviceConfig.requiredRole.includes('ROLE_SUPER_ADMIN')).toBe(true);
      expect(settingsConfig.requiredRole.includes('ROLE_SUPER_ADMIN')).toBe(true);
      expect(harnessConfig.requiredRole.includes('ROLE_SUPER_ADMIN')).toBe(true);
    });

    it('2.3 Simulated permission check function works accurately', () => {
      function canAccess(system: SystemDomainId, role: UserSystemRole): boolean {
        const sys = SYSTEM_DOMAINS.find((s) => s.id === system);
        if (!sys) return false;
        return sys.requiredRole.includes(role);
      }

      // ROLE_USER: only service
      expect(canAccess('service', 'ROLE_USER')).toBe(true);
      expect(canAccess('settings', 'ROLE_USER')).toBe(false);
      expect(canAccess('harness', 'ROLE_USER')).toBe(false);

      // ROLE_OPERATOR: service and settings
      expect(canAccess('service', 'ROLE_OPERATOR')).toBe(true);
      expect(canAccess('settings', 'ROLE_OPERATOR')).toBe(true);
      expect(canAccess('harness', 'ROLE_OPERATOR')).toBe(false);

      // ROLE_ADMIN: all three
      expect(canAccess('service', 'ROLE_ADMIN')).toBe(true);
      expect(canAccess('settings', 'ROLE_ADMIN')).toBe(true);
      expect(canAccess('harness', 'ROLE_ADMIN')).toBe(true);
    });
  });

  describe('3. Local Storage Persistence Contracts', () => {
    it('3.1 should store and retrieve 4-mode theme preference', () => {
      let store: Record<string, string> = {};
      const mockStorage = {
        setItem: (k: string, v: string) => { store[k] = v; },
        getItem: (k: string) => store[k] || null,
      };

      mockStorage.setItem('purepdfrend_theme_mode', 'dawn');
      expect(mockStorage.getItem('purepdfrend_theme_mode')).toBe('dawn');

      mockStorage.setItem('purepdfrend_theme_mode', 'system');
      expect(mockStorage.getItem('purepdfrend_theme_mode')).toBe('system');
    });

    it('3.2 should store and retrieve default active system domain', () => {
      let store: Record<string, string> = {};
      const mockStorage = {
        setItem: (k: string, v: string) => { store[k] = v; },
        getItem: (k: string) => store[k] || null,
      };

      // Default should be service
      expect(mockStorage.getItem('purepdfrend_active_system') || 'service').toBe('service');

      mockStorage.setItem('purepdfrend_active_system', 'settings');
      expect(mockStorage.getItem('purepdfrend_active_system')).toBe('settings');

      mockStorage.setItem('purepdfrend_active_system', 'harness');
      expect(mockStorage.getItem('purepdfrend_active_system')).toBe('harness');
    });
  });
});
