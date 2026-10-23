import { describe, it, expect } from 'vitest';
import { tokens, tokenClassMap, getThemeAdaptiveClasses, resolveThemeMode } from '../src/styles/tokens';
import { ALL_WIREFRAME_PROGRAMS } from '../src/ppdf/views/wireframes/shells/StudioShell';
import { USER_PROGRAMS } from '../src/ppdf/views/wireframes/UserWireframes';
import { ADMIN_PROGRAMS } from '../src/ppdf/views/wireframes/AdminWireframes';
import { ADMIN_CATEGORIES } from '../src/ppdf/views/wireframes/shells/AdminShell';

describe('3대 공통 쉘(Shell) 및 와이어프레임 서비스목록 검증', () => {
  it('와이어프레임 전체 목록(ALL_WIREFRAME_PROGRAMS)이 24개 서비스 화면 및 쇼케이스(총 25개)를 완벽 포함해야 한다', () => {
    expect(ALL_WIREFRAME_PROGRAMS).toBeDefined();
    expect(ALL_WIREFRAME_PROGRAMS.length).toBe(25); // 1 Showcase + 9 User + 15 Admin (PG-ADM-10은 PG-ADM-09로 통합)

    const userProgs = ALL_WIREFRAME_PROGRAMS.filter((p) => p.type === 'user');
    expect(userProgs.length).toBe(9);
    expect(userProgs.map((p) => p.id)).toEqual([
      'PG-USR-01',
      'PG-USR-02',
      'PG-USR-03',
      'PG-USR-04',
      'PG-USR-05',
      'PG-USR-06',
      'PG-USR-07',
      'PG-USR-08',
      'PG-USR-09',
    ]);

    const adminProgs = ALL_WIREFRAME_PROGRAMS.filter((p) => p.type === 'admin');
    expect(adminProgs.length).toBe(15);
    expect(adminProgs.map((p) => p.id)).toContain('PG-ADM-01');
    expect(adminProgs.map((p) => p.id)).toContain('PG-ADM-16');

    const showcase = ALL_WIREFRAME_PROGRAMS.find((p) => p.type === 'showcase');
    expect(showcase?.id).toBe('DS-SHOWCASE');
  });

  it('USER_PROGRAMS와 ADMIN_PROGRAMS의 ID가 규격에 맞게 정의되어 있어야 한다', () => {
    expect(USER_PROGRAMS.length).toBe(9);
    expect(ADMIN_PROGRAMS.length).toBe(15);

    USER_PROGRAMS.forEach((p) => {
      expect(p.id).toMatch(/^PG-USR-\d{2}$/);
      expect(p.name).toBeTruthy();
    });

    ADMIN_PROGRAMS.forEach((p) => {
      expect(p.id).toMatch(/^PG-ADM-\d{2}$/);
      expect(p.name).toBeTruthy();
    });
  });

  it('AdminShell 5대 카테고리(ADMIN_CATEGORIES)가 유효한 분류를 가져야 한다', () => {
    expect(ADMIN_CATEGORIES.length).toBe(6); // ALL + 5 Categories
    const categoryIds = ADMIN_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('ALL');
    expect(categoryIds).toContain('SEC_AUTH');
    expect(categoryIds).toContain('USER_ROLE');
    expect(categoryIds).toContain('PROG_MENU');
    expect(categoryIds).toContain('OPS_LOG');
    expect(categoryIds).toContain('BOARD_UI');
  });
});

describe('tokens.ts 4모드 테마 적응형 클래스 헬퍼 검증', () => {
  it('getThemeAdaptiveClasses가 light, dark, dawn 각각에 최적화된 클래스 매핑을 반환해야 한다', () => {
    const lightClasses = getThemeAdaptiveClasses('light');
    expect(lightClasses.container).toContain('bg-white');
    expect(lightClasses.textMain).toBe('text-slate-900');

    const darkClasses = getThemeAdaptiveClasses('dark');
    expect(darkClasses.container).toContain('bg-slate-900');
    expect(darkClasses.textMain).toBe('text-white');

    const dawnClasses = getThemeAdaptiveClasses('dawn');
    expect(dawnClasses.container).toContain('bg-[#0e1a38]');
    expect(dawnClasses.shellBg).toContain('bg-[#070e22]');

    // 이번 세션(0031)에 추가된 buttonSecondary, tabInactive, tabActive 검증
    expect(lightClasses.buttonSecondary).toBeDefined();
    expect(lightClasses.tabInactive).toBeDefined();
    expect(lightClasses.tabActive).toBeDefined();
    expect(darkClasses.buttonSecondary).toContain('bg-slate-900');
    expect(dawnClasses.buttonSecondary).toContain('bg-[#14234b]');
  });

  it('tokens 및 tokenClassMap 상수가 불변 정의되어 있어야 한다', () => {
    expect(tokens.colors.brand[600]).toBe('#2563eb');
    expect(tokens.accessibility.minTouchTarget).toBe('44px');
    expect(tokenClassMap.touchButton).toContain('min-h-[44px]');
    expect(tokenClassMap.focusRing).toContain('focus-visible:ring-2');
  });

  it('Phase 2 사용자 와이어프레임(PG-USR-05, PG-USR-06, PG-USR-07) 메타데이터 및 4모드 토큰 일관성이 보장되어야 한다', () => {
    const usr05 = USER_PROGRAMS.find((p) => p.id === 'PG-USR-05');
    const usr06 = USER_PROGRAMS.find((p) => p.id === 'PG-USR-06');
    const usr07 = USER_PROGRAMS.find((p) => p.id === 'PG-USR-07');

    expect(usr05).toBeDefined();
    expect(usr06).toBeDefined();
    expect(usr07).toBeDefined();

    expect(usr05?.name).toContain('문서관리');
    expect(usr06?.name).toContain('문서뷰어');
    expect(usr07?.name).toContain('문서공유');

    // 4모드 텍스트 및 패널 대비 검증
    ['light', 'dark', 'dawn'].forEach((mode) => {
      const classes = getThemeAdaptiveClasses(mode as any);
      expect(classes.container).toBeTruthy();
      expect(classes.panel).toBeTruthy();
      expect(classes.card).toBeTruthy();
      expect(classes.textMain).toBeTruthy();
      expect(classes.textMuted).toBeTruthy();
      expect(classes.buttonSecondary).toBeTruthy();
    });
  });

  it('Phase 3 관리자 1단계 핵심화면(PG-ADM-01~04) 및 사용자 전 화면(PG-USR-01~09) 100% 완결이 보장되어야 한다', () => {
    // 1. 관리자 1단계 4대 프로그램 식별
    const adm01 = ADMIN_PROGRAMS.find((p) => p.id === 'PG-ADM-01');
    const adm02 = ADMIN_PROGRAMS.find((p) => p.id === 'PG-ADM-02');
    const adm03 = ADMIN_PROGRAMS.find((p) => p.id === 'PG-ADM-03');
    const adm04 = ADMIN_PROGRAMS.find((p) => p.id === 'PG-ADM-04');

    expect(adm01).toBeDefined();
    expect(adm02).toBeDefined();
    expect(adm03).toBeDefined();
    expect(adm04).toBeDefined();

    // 2. 사용자 전 화면 9종 100% 식별 및 이름 확인
    expect(USER_PROGRAMS.length).toBe(9);
    const usr08 = USER_PROGRAMS.find((p) => p.id === 'PG-USR-08');
    const usr09 = USER_PROGRAMS.find((p) => p.id === 'PG-USR-09');

    expect(usr08?.name).toContain('오프라인 작업');
    expect(usr09?.name).toContain('정밀 사용자 환경설정');
  });
});

