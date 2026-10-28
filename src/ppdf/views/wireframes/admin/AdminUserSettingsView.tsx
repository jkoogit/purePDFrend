import { useState } from 'react';
import { Button, Input, Textarea, Badge, Card, Modal } from '@shared/components/ui';

export interface UserSettingItem {
  key: string;
  label: string;
  category: 'VIEWER' | 'THEME' | 'EDITOR' | 'STORAGE';
  uiType: 'DROPDOWN' | 'RADIO' | 'CHECKBOX' | 'SLIDER' | 'TEXT';
  defaultValue: string;
  options?: string[];
  desc: string;
}

const DEFAULT_SETTINGS: UserSettingItem[] = [
  {
    key: 'VIEWER_DEFAULT_ZOOM',
    label: '기본 줌 배율',
    category: 'VIEWER',
    uiType: 'DROPDOWN',
    defaultValue: '페이지 폭 맞춤',
    options: ['100%', '페이지 폭 맞춤', '페이지 전체 맞춤', '150%', '200%'],
    desc: '문서 최초 열람 시 적용되는 기본 화면 확대/축소 배율입니다.',
  },
  {
    key: 'DARK_MODE_PRESET',
    label: '테마 기본값',
    category: 'THEME',
    uiType: 'RADIO',
    defaultValue: '시스템 설정 동기화',
    options: ['시스템 설정 동기화', '다크 모드', '라이트 모드'],
    desc: 'OS 환경 또는 사용자 지정에 따른 기본 컬러 테마 모드입니다.',
  },
  {
    key: 'OFFLINE_AUTO_SYNC',
    label: '오프라인 자동 병합',
    category: 'STORAGE',
    uiType: 'CHECKBOX',
    defaultValue: 'ON (3-Way 스마트 머지)',
    options: ['ON', 'OFF'],
    desc: '네트워크 재연결 시 로컬 변경사항을 클라우드와 자동 동기화합니다.',
  },
  {
    key: 'AUTO_SAVE_INTERVAL',
    label: '주석 자동 저장 주기',
    category: 'EDITOR',
    uiType: 'DROPDOWN',
    defaultValue: '30초',
    options: ['즉시 (실시간)', '15초', '30초', '1분', '수동 저장만'],
    desc: '주석 및 하이라이트 편집 시 로컬 캐시에 자동 영속화하는 주기입니다.',
  },
  {
    key: 'OCR_AUTO_TRIGGER',
    label: '문서 열람 시 OCR 자동 인식',
    category: 'VIEWER',
    uiType: 'CHECKBOX',
    defaultValue: 'OFF (선택 실행)',
    options: ['ON', 'OFF'],
    desc: '스캔된 이미지 PDF 감지 시 백그라운드 OCR 자동 수행 여부입니다.',
  },
  {
    key: 'DEFAULT_PAGE_VIEW_MODE',
    label: '기본 페이지 레이아웃',
    category: 'VIEWER',
    uiType: 'DROPDOWN',
    defaultValue: '단일 페이지 연속 스크롤',
    options: ['단일 페이지 연속 스크롤', '단일 페이지 단독', '양면 펼침 보기', '썸네일 그리드'],
    desc: '기본 뷰어 모드 진입 시 표시되는 페이지 렌더링 레이아웃입니다.',
  },
];

export function AdminUserSettingsView() {
  const [settings, setSettings] = useState<UserSettingItem[]>(DEFAULT_SETTINGS);
  const [showModal, setShowModal] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Form states
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formCategory, setFormCategory] = useState<'VIEWER' | 'THEME' | 'EDITOR' | 'STORAGE'>('VIEWER');
  const [formUiType, setFormUiType] = useState<'DROPDOWN' | 'RADIO' | 'CHECKBOX' | 'SLIDER' | 'TEXT'>('DROPDOWN');
  const [formDefaultVal, setFormDefaultVal] = useState('');
  const [formOptions, setFormOptions] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const openCreate = () => {
    setEditingKey(null);
    setFormKey('');
    setFormLabel('');
    setFormCategory('VIEWER');
    setFormUiType('DROPDOWN');
    setFormDefaultVal('');
    setFormOptions('옵션1, 옵션2, 옵션3');
    setFormDesc('');
    setShowModal(true);
  };

  const openEdit = (item: UserSettingItem) => {
    setEditingKey(item.key);
    setFormKey(item.key);
    setFormLabel(item.label);
    setFormCategory(item.category);
    setFormUiType(item.uiType);
    setFormDefaultVal(item.defaultValue);
    setFormOptions(item.options ? item.options.join(', ') : '');
    setFormDesc(item.desc);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formKey.trim() || !formLabel.trim()) return;
    const parsedOptions = formOptions ? formOptions.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

    if (editingKey) {
      setSettings(
        settings.map((s) =>
          s.key === editingKey
            ? {
                ...s,
                label: formLabel,
                category: formCategory,
                uiType: formUiType,
                defaultValue: formDefaultVal,
                options: parsedOptions,
                desc: formDesc,
              }
            : s
        )
      );
    } else {
      setSettings([
        ...settings,
        {
          key: formKey.toUpperCase(),
          label: formLabel,
          category: formCategory,
          uiType: formUiType,
          defaultValue: formDefaultVal,
          options: parsedOptions,
          desc: formDesc,
        },
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (key: string) => {
    if (window.confirm(`설정 항목 [${key}]을(를) 삭제하시겠습니까?`)) {
      setSettings(settings.filter((s) => s.key !== key));
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <Card variant="subtle" className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="font-bold text-white text-sm">⚙️ 사용자 환경설정 항목 및 기본값 관리 (등록/수정/삭제 완비)</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            사용자 마이페이지 환경설정에 제공되는 기본 설정 항목(테마, 배율, 자동저장, OCR) 및 메타데이터를 관리합니다.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openCreate}
          leftIcon={<span>+</span>}
          className="text-xs shrink-0 self-start sm:self-auto"
        >
          설정 항목 추가
        </Button>
      </Card>

      {/* 설정 항목 그리드 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {settings.map((item) => (
          <Card key={item.key} variant="subtle" className="p-3.5 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Badge variant="primary" size="sm">
                  {item.category}
                </Badge>
                <span className="text-slate-500 font-mono text-[10px]">{item.uiType}</span>
              </div>
              <div className="font-mono text-indigo-300 font-bold text-xs">{item.key}</div>
              <div className="text-slate-200 font-medium text-sm">{item.label}</div>
              <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">{item.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-900 space-y-2">
              <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-emerald-400 font-mono text-[11px]">
                기본값: <strong className="text-emerald-300">{item.defaultValue}</strong>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(item)}
                  className="text-xs px-2.5 py-1"
                >
                  수정
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(item.key)}
                  className="text-xs px-2.5 py-1"
                >
                  삭제
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 설정 등록/수정 모달 */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingKey ? `✏️ 설정 항목 수정: [${editingKey}]` : '⚙️ 신규 환경설정 메타데이터 등록'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>취소</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>저장 완료</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Input
                label="설정 키 (Config Key)"
                disabled={!!editingKey}
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                placeholder="예: AUTO_SYNC_LIMIT"
                className="font-mono"
              />
            </div>
            <div>
              <Input
                label="설정 라벨 (Label)"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="예: 자동동기화 한도"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">카테고리</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
              >
                <option value="VIEWER">뷰어 (VIEWER)</option>
                <option value="THEME">테마 (THEME)</option>
                <option value="EDITOR">편집기 (EDITOR)</option>
                <option value="STORAGE">스토리지 (STORAGE)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">UI 컨트롤 타입</label>
              <select
                value={formUiType}
                onChange={(e) => setFormUiType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
              >
                <option value="DROPDOWN">드롭다운 (DROPDOWN)</option>
                <option value="RADIO">라디오 버튼 (RADIO)</option>
                <option value="CHECKBOX">체크박스 토글 (CHECKBOX)</option>
                <option value="SLIDER">슬라이더 (SLIDER)</option>
                <option value="TEXT">텍스트 입력 (TEXT)</option>
              </select>
            </div>
          </div>

          <div>
            <Input
              label="시스템 기본값 (Default Value)"
              value={formDefaultVal}
              onChange={(e) => setFormDefaultVal(e.target.value)}
              placeholder="예: ON 또는 100%"
            />
          </div>

          <div>
            <Input
              label="선택지 목록 (쉼표 구분)"
              value={formOptions}
              onChange={(e) => setFormOptions(e.target.value)}
              placeholder="예: 100%, 150%, 200%"
              className="font-mono"
            />
          </div>

          <div>
            <Textarea
              label="설명 및 안내 문구"
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="설정 항목에 대한 가이드 문구"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
