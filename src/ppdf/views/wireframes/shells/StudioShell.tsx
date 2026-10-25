import React from 'react';
import { ThemeMode, resolveThemeMode, getThemeAdaptiveClasses } from '../../../../styles/tokens';

export interface StudioShellProps {
  activeTab?: 'showcase' | 'user' | 'admin';
  onChangeTab?: (tab: 'showcase' | 'user' | 'admin') => void;
  viewportMode: 'full' | 'tablet' | 'mobile';
  onChangeViewport?: (mode: 'full' | 'tablet' | 'mobile') => void;
  themeMode?: ThemeMode;
  onSelectWireframeProgram?: (type: 'user' | 'admin' | 'showcase', progId: string) => void;
  children: React.ReactNode;
}

// 25개 와이어프레임 프로그램 전체 레지스트리 (상단 중앙 퀵 셀렉트용)
export const ALL_WIREFRAME_PROGRAMS = [
  { group: '쇼케이스', type: 'showcase' as const, id: 'DS-SHOWCASE', name: '디자인시스템 쇼케이스', desc: '8대 Primitive UI & 토큰 팔레트' },
  // 사용자 서비스 (9개)
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-01', name: '첫화면 (랜딩)', desc: '공개 문서조회, 롤링배너, 공지/리뷰' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-02', name: '로그인 / 회원가입', desc: '소셜/이메일 2FA 탭 전환, 약관동의' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-03', name: '홈화면 (대시보드)', desc: '7대 PDF 핵심도구 퀵그리드, 프로필' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-04', name: '마이페이지 > 사용자관리', desc: '비밀번호 변경, 2FA, 닉네임 수정' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-05', name: '문서관리 (라이브러리)', desc: '8대 상세필터, 4종 다운로드 모달' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-06', name: '문서뷰어 & 주석스튜디오', desc: '단일줄 툴바+슬라이더, 8대 모드' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-07', name: '문서공유 및 협업작업뷰', desc: '공유권한 설정, 동시접속자 목록' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-08', name: '오프라인 작업 정리', desc: '리소스모드/문서모드, 3Way 충돌머지' },
  { group: '사용자 서비스 (9개)', type: 'user' as const, id: 'PG-USR-09', name: '정밀 사용자 환경설정', desc: '단축키설정(PC/태블릿), 도구그룹설정' },
  // 관리자 서비스 (16개)
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-01', name: '보안관리', desc: '화이트리스트 & 2FA 강제화, 세션만료' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-02', name: '프로그램관리', desc: 'DAG 순환방지, 다중권한 설정' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-03', name: '사용자관리', desc: '프로필 사진, 상세조회, 스토리지' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-04', name: '약관·동의·정책', desc: '적용버전만 보기, 이전약관 수정' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-05', name: '사용자 권한관리', desc: '권한/프로그램/사용자 3대 탭' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-06', name: '메뉴관리', desc: '메뉴 계층, 화면 프로그램 매핑' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-07', name: '로그관리', desc: '다차원 감사로그 필터, PDF 변경추적' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-08', name: '알림관리', desc: '공지안내, OCR 완료알림, 개인알림' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-09', name: 'API 연동관리', desc: '내부 서비스 및 외부 OAuth/Gemini 통합' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-11', name: '사용자설정 항목관리', desc: '체크박스/드롭다운 메타데이터 관리' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-12', name: '게시판·배너관리', desc: '예약공지, 다시열지않기, 배너순서' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-13', name: '고객관리', desc: 'FAQ, 공개 QNA, 1:1 상담' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-14', name: '무료글꼴관리', desc: '웹폰트 WOFF2/TTF 등록, 프리뷰' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-15', name: '단축키 및 도구아이콘 관리', desc: '시스템 기본 vs 커스텀 우선, 리소스' },
  { group: '관리자 서비스 (16개)', type: 'admin' as const, id: 'PG-ADM-16', name: '도구그룹관리', desc: '8대 뷰어모드별 도구편성, 영향도 검토' },
];

export function StudioShell({
  viewportMode,
  themeMode = 'dark',
  children,
}: StudioShellProps) {
  const resolvedTheme = resolveThemeMode(themeMode);
  const themeClasses = getThemeAdaptiveClasses(resolvedTheme);

  return (
    <div className={`space-y-6 font-sans ${themeClasses.shellBg} transition-colors duration-200`}>
      {/* 뷰포트 래퍼 (시뮬레이션 모드 반영) */}
      <div
        className={`mx-auto transition-all duration-300 ${
          viewportMode === 'mobile'
            ? 'max-w-[410px] p-2 bg-slate-950/80 rounded-3xl border-4 border-slate-800 shadow-2xl'
            : viewportMode === 'tablet'
            ? 'max-w-[800px] p-3 bg-slate-950/50 rounded-2xl border-2 border-slate-800 shadow-xl'
            : 'w-full'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
