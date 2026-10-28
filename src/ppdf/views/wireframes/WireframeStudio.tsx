import { useState, useEffect } from 'react';
import { AdminWireframes } from './AdminWireframes';
import { UserWireframes } from './UserWireframes';
import { DesignSystemShowcase } from './DesignSystemShowcase';
import { StudioShell } from './shells/StudioShell';

export interface WireframeStudioProps {
  initialTab?: 'showcase' | 'user' | 'admin';
  initialProgId?: string;
}

export function WireframeStudio({ initialTab = 'showcase', initialProgId }: WireframeStudioProps) {
  const [activeTab, setActiveTab] = useState<'showcase' | 'user' | 'admin'>(initialTab);
  const [viewportMode, setViewportMode] = useState<'full' | 'tablet' | 'mobile'>('full');
  const [currentProgId, setCurrentProgId] = useState<string | undefined>(initialProgId);

  // 전역 와이어프레임 퀵 점프 이벤트 리스너 연동 (Navbar 및 상단 셀렉터)
  useEffect(() => {
    const handleNavigate = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (detail.type === 'user') {
        setActiveTab('user');
        if (detail.progId) setCurrentProgId(detail.progId);
      } else if (detail.type === 'admin') {
        setActiveTab('admin');
        if (detail.progId) setCurrentProgId(detail.progId);
      } else if (detail.type === 'showcase') {
        setActiveTab('showcase');
      } else if (detail.type === 'settings') {
        // 설정 항목 중 서비스 화면 외 와이어프레임 폴백 화면 연결
        if (detail.progId === 'PG-SET-03' || detail.progId === 'PG-SET-05') {
          setActiveTab('user');
          setCurrentProgId(detail.progId === 'PG-SET-03' ? 'PG-USR-09' : 'PG-USR-08');
        } else if (detail.progId === 'PG-SET-04') {
          setActiveTab('admin');
          setCurrentProgId('PG-ADM-14');
        } else {
          setActiveTab('admin');
          setCurrentProgId('PG-ADM-01');
        }
      }
    };
    window.addEventListener('purepdfrend-navigate-wireframe', handleNavigate);
    return () => window.removeEventListener('purepdfrend-navigate-wireframe', handleNavigate);
  }, []);

  const handleSelectProgramFromShell = (type: 'showcase' | 'user' | 'admin', progId: string) => {
    setActiveTab(type);
    setCurrentProgId(progId);
  };

  return (
    <StudioShell
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      viewportMode={viewportMode}
      onChangeViewport={setViewportMode}
      onSelectWireframeProgram={handleSelectProgramFromShell}
    >
      {activeTab === 'showcase' ? (
        <DesignSystemShowcase />
      ) : activeTab === 'user' ? (
        <UserWireframes isMobileMode={viewportMode === 'mobile'} initialProgId={currentProgId} />
      ) : (
        <AdminWireframes isMobileMode={viewportMode === 'mobile'} initialProgId={currentProgId} />
      )}
    </StudioShell>
  );
}
