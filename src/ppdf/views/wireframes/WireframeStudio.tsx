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
      if (detail?.type) {
        setActiveTab(detail.type);
        if (detail.progId) {
          setCurrentProgId(detail.progId);
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
