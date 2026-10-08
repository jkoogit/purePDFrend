import { useState } from 'react';
import { Button, Input, Textarea, Badge, Card, Modal } from '@shared/components/ui';

// ============================================================================
// PG-ADM-08: 알림관리 (요청 10: 생성화면 추가, 모바일 카드보기, 사용여부 추가, 상세 수정/삭제)
// ============================================================================
export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: '점검안내' | 'OCR서비스' | '개인알림' | '보안공지';
  target: '전체 사용자' | '개인알림 (요청자)' | '관리자 그룹';
  channel: string;
  date: string;
  active: boolean; // 사용여부
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'NT-01', title: '시스템 정기점검 안내', content: '10월 10일 02:00~06:00 정기 점검이 진행됩니다.', type: '점검안내', target: '전체 사용자', channel: '인앱 팝업 + 이메일', date: '2026-10-10', active: true },
  { id: 'NT-02', title: '대용량 OCR 텍스트 추출 완료', content: '요청하신 840쪽 문서의 인라인 OCR 처리가 100% 완료되었습니다.', type: 'OCR서비스', target: '개인알림 (요청자)', channel: '웹 푸시', date: '2026-10-05', active: true },
  { id: 'NT-03', title: '보안 정책 2FA 인증키 갱신', content: 'OTP 보안 세션이 갱신되었습니다. 백업 코드를 확인하세요.', type: '보안공지', target: '관리자 그룹', channel: '이메일', date: '2026-10-04', active: false },
];

export function AdminNotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NotificationItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<'점검안내' | 'OCR서비스' | '개인알림' | '보안공지'>('점검안내');
  const [formTarget, setFormTarget] = useState<'전체 사용자' | '개인알림 (요청자)' | '관리자 그룹'>('전체 사용자');
  const [formChannel, setFormChannel] = useState('웹푸시 + 인앱');
  const [formActive, setFormActive] = useState(true);

  const openCreate = () => {
    setFormTitle('');
    setFormContent('');
    setFormType('점검안내');
    setFormTarget('전체 사용자');
    setFormChannel('웹푸시 + 인앱');
    setFormActive(true);
    setEditingItem(null);
    setShowCreateModal(true);
  };

  const openEdit = (item: NotificationItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormType(item.type);
    setFormTarget(item.target);
    setFormChannel(item.channel);
    setFormActive(item.active);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    if (editingItem) {
      setNotifications(
        notifications.map((n) =>
          n.id === editingItem.id
            ? { ...n, title: formTitle, content: formContent, type: formType, target: formTarget, channel: formChannel, active: formActive }
            : n
        )
      );
    } else {
      setNotifications([
        ...notifications,
        {
          id: `NT-${String(notifications.length + 1).padStart(2, '0')}`,
          title: formTitle,
          content: formContent,
          type: formType,
          target: formTarget,
          channel: formChannel,
          date: new Date().toISOString().split('T')[0],
          active: formActive,
        },
      ]);
    }
    setShowCreateModal(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`알림 [${id}]을(를) 삭제하시겠습니까?`)) {
      setNotifications(notifications.filter((n) => n.id !== id));
      if (editingItem?.id === id) {
        setShowCreateModal(false);
        setEditingItem(null);
      }
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <Card variant="subtle" className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="font-bold text-white text-sm">🔔 알림 관리 (공지 / 서비스 / 개인알림)</span>
          <p className="text-[11px] text-slate-400 mt-0.5">시스템 점검공지 및 OCR 처리완료, 개인보안 알림 템플릿과 사용여부를 관리합니다.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openCreate}
          className="text-xs shrink-0"
        >
          + 신규 알림 등록
        </Button>
      </Card>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">알림 ID</th>
              <th className="p-3">제목</th>
              <th className="p-3">분류</th>
              <th className="p-3">수신 대상</th>
              <th className="p-3">발송 채널</th>
              <th className="p-3">사용 여부</th>
              <th className="p-3">발송일</th>
              <th className="p-3 text-center">관리 조치</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {notifications.map((n) => (
              <tr key={n.id} className="hover:bg-slate-900/40">
                <td className="p-3 font-mono font-bold text-indigo-300">{n.id}</td>
                <td className="p-3 font-medium text-slate-200">{n.title}</td>
                <td className="p-3">
                  <Badge variant="primary" size="sm">{n.type}</Badge>
                </td>
                <td className="p-3 text-emerald-400">{n.target}</td>
                <td className="p-3 text-slate-400">{n.channel}</td>
                <td className="p-3">
                  <button
                    onClick={() => setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, active: !x.active } : x)))}
                    className="cursor-pointer"
                  >
                    <Badge variant={n.active ? 'success' : 'neutral'} size="sm" dot={true}>
                      {n.active ? '활성 (사용중)' : '비활성 (정지)'}
                    </Badge>
                  </button>
                </td>
                <td className="p-3 font-mono text-slate-500">{n.date}</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center items-center gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(n)} className="text-xs px-2.5 py-1">수정</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(n.id)} className="text-xs px-2.5 py-1">삭제</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 (요청 10) */}
      <div className="block md:hidden space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} variant="subtle" className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-indigo-300">{n.id}</span>
              <button
                onClick={() => setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, active: !x.active } : x)))}
                className="cursor-pointer"
              >
                <Badge variant={n.active ? 'success' : 'neutral'} size="sm" dot={true}>
                  {n.active ? '활성' : '비활성'}
                </Badge>
              </button>
            </div>
            <div className="font-bold text-slate-200 text-sm">{n.title}</div>
            <div className="text-[11px] text-slate-400">{n.content}</div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>{n.type} | {n.target}</span>
              <span>{n.date}</span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-900">
              <Button variant="secondary" size="sm" onClick={() => openEdit(n)} className="flex-1 text-xs">수정</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(n.id)} className="flex-1 text-xs">삭제</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* 알림 생성 및 수정 팝업 모달 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingItem ? `✏️ 알림 상세 수정 [${editingItem.id}]` : '🔔 신규 알림 등록'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>취소</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>저장 완료</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <Input
              label="알림 제목"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="예: 정기 서버 점검 안내"
            />
          </div>

          <div>
            <Textarea
              label="상세 안내 내용"
              rows={3}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="사용자에게 전달할 상세 메시지 입력"
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">알림 유형</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
              >
                <option value="점검안내">공지: 점검안내</option>
                <option value="OCR서비스">서비스: OCR 완료안내</option>
                <option value="개인알림">개인알림: 계정/보안</option>
                <option value="보안공지">보안공지: 관리자 전용</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">수신 대상</label>
              <select
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
              >
                <option value="전체 사용자">전체 사용자 (공지)</option>
                <option value="개인알림 (요청자)">개인알림 (요청자 한정)</option>
                <option value="관리자 그룹">관리자 전용</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center pt-1">
            <div>
              <Input
                label="발송 채널"
                value={formChannel}
                onChange={(e) => setFormChannel(e.target.value)}
              />
            </div>
            <div className="pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="notifActive"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="accent-indigo-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="notifActive" className="text-slate-300 cursor-pointer">
                즉시 활성화 (사용 여부)
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// PG-ADM-09 & 10: API 관리 (요청 11: 등록/수정/삭제/사용여부 보완, 내부/외부 화면 통합, 중복 제거)
// ============================================================================
export interface ApiEndpointItem {
  id: string;
  name: string;
  category: 'INTERNAL' | 'EXTERNAL';
  endpoint: string;
  status: '정상 (200 OK)' | '지연' | '점검중';
  latency: string;
  keyMasked: string;
  active: boolean; // 사용여부
}

const INITIAL_APIS: ApiEndpointItem[] = [
  { id: 'API-INT-01', name: 'OCR 배치 서비스 API', category: 'INTERNAL', endpoint: '/api/pdf/ocr/batch', status: '정상 (200 OK)', latency: '120ms', keyMasked: 'jwt-internal-worker', active: true },
  { id: 'API-INT-02', name: 'PDF Core 렌더링 엔진 API', category: 'INTERNAL', endpoint: '/api/pdf/render/canvas', status: '정상 (200 OK)', latency: '14ms', keyMasked: 'native-wasm-core', active: true },
  { id: 'API-INT-03', name: '3-Way 주석 충돌머지 API', category: 'INTERNAL', endpoint: '/api/annotations/smart-merge', status: '정상 (200 OK)', latency: '35ms', keyMasked: 'indexeddb-sync-token', active: true },
  { id: 'API-EXT-01', name: 'Google OAuth 2.0 & Drive API', category: 'EXTERNAL', endpoint: 'https://www.googleapis.com/drive/v3', status: '정상 (200 OK)', latency: '210ms', keyMasked: '644708...apps.google.com', active: true },
  { id: 'API-EXT-02', name: 'Gemini Multimodal Vision API', category: 'EXTERNAL', endpoint: 'https://generativelanguage.googleapis.com', status: '정상 (200 OK)', latency: '480ms', keyMasked: 'sk-gemini-****-9821', active: true },
  { id: 'API-EXT-03', name: 'DeepL 번역 엔진 API', category: 'EXTERNAL', endpoint: 'https://api-free.deepl.com/v2/translate', status: '정상 (200 OK)', latency: '310ms', keyMasked: 'deepl-auth-****-4411', active: false },
];

export function AdminApiManagerView() {
  const [apiList, setApiList] = useState<ApiEndpointItem[]>(INITIAL_APIS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');
  const [showApiModal, setShowApiModal] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiEndpointItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [formEndpoint, setFormEndpoint] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formActive, setFormActive] = useState(true);

  const openCreate = () => {
    setEditingApi(null);
    setFormName('');
    setFormCategory('INTERNAL');
    setFormEndpoint('/api/custom/endpoint');
    setFormKey('auth-token-key');
    setFormActive(true);
    setShowApiModal(true);
  };

  const openEdit = (api: ApiEndpointItem) => {
    setEditingApi(api);
    setFormName(api.name);
    setFormCategory(api.category);
    setFormEndpoint(api.endpoint);
    setFormKey(api.keyMasked);
    setFormActive(api.active);
    setShowApiModal(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formEndpoint.trim()) return;
    if (editingApi) {
      setApiList(
        apiList.map((a) =>
          a.id === editingApi.id
            ? { ...a, name: formName, category: formCategory, endpoint: formEndpoint, keyMasked: formKey, active: formActive }
            : a
        )
      );
    } else {
      const prefix = formCategory === 'INTERNAL' ? 'API-INT' : 'API-EXT';
      setApiList([
        ...apiList,
        {
          id: `${prefix}-${String(apiList.length + 1).padStart(2, '0')}`,
          name: formName,
          category: formCategory,
          endpoint: formEndpoint,
          status: '정상 (200 OK)',
          latency: '45ms',
          keyMasked: formKey,
          active: formActive,
        },
      ]);
    }
    setShowApiModal(false);
    setEditingApi(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`API [${id}]을(를) 삭제하시겠습니까?`)) {
      setApiList(apiList.filter((a) => a.id !== id));
      if (editingApi?.id === id) setShowApiModal(false);
    }
  };

  const filteredApis = apiList.filter((a) => {
    if (activeTab === 'ALL') return true;
    return a.category === activeTab;
  });

  return (
    <div className="space-y-4 text-xs">
      {/* 단일 통합 헤더 및 요약 대시보드 (요청 4 반영: 내부/외부 API 단일화) */}
      <Card variant="default" className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔗</span>
              <span className="font-bold text-white text-sm">API 연동관리 (내부 서비스 & 외부 연동 단일 통합)</span>
              <Badge variant="success" size="sm">통합 단일 관리</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              내부 서비스 엔진 API(OCR 배치, PDF Core 렌더링, 3-Way 충돌머지)와 외부 연동 API(Google OAuth, Gemini AI, 번역)를 단일 화면에서 통합 관리합니다.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreate}
            leftIcon={<span>+</span>}
            className="text-xs shrink-0 self-start sm:self-auto"
          >
            통합 API 등록
          </Button>
        </div>

        {/* 3대 요약 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">총 등록 API:</span>
            <span className="font-mono font-bold text-white text-xs">{apiList.length}건 ({apiList.filter((a) => a.active).length}건 활성)</span>
          </div>
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-sky-900/40 flex items-center justify-between">
            <span className="text-sky-300 text-[11px]">⚙️ 내부 서비스 API:</span>
            <span className="font-mono font-bold text-sky-400 text-xs">{apiList.filter((a) => a.category === 'INTERNAL').length}건 정상 가동</span>
          </div>
          <div className="p-2.5 bg-slate-950/80 rounded-lg border border-purple-900/40 flex items-center justify-between">
            <span className="text-purple-300 text-[11px]">🌐 외부 연동 API:</span>
            <span className="font-mono font-bold text-purple-400 text-xs">{apiList.filter((a) => a.category === 'EXTERNAL').length}건 연동 가동</span>
          </div>
        </div>
      </Card>

      <Card variant="subtle" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === 'ALL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('ALL')}
            className="text-xs"
          >
            전체 통합 API ({apiList.length})
          </Button>
          <Button
            variant={activeTab === 'INTERNAL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('INTERNAL')}
            className="text-xs"
          >
            ⚙️ 내부 서비스 API
          </Button>
          <Button
            variant={activeTab === 'EXTERNAL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('EXTERNAL')}
            className="text-xs"
          >
            🌐 외부 연동 API
          </Button>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          표시 중: <Badge variant="primary" size="sm">{filteredApis.length}개</Badge> 항목
        </div>
      </Card>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">API 식별자</th>
              <th className="p-3">API 서비스명</th>
              <th className="p-3">구분</th>
              <th className="p-3">엔드포인트 URL</th>
              <th className="p-3">지연시간</th>
              <th className="p-3">사용 여부</th>
              <th className="p-3 text-center">관리 조치</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredApis.map((a) => (
              <tr key={a.id} className="hover:bg-slate-900/40">
                <td className="p-3 font-mono font-bold text-indigo-300">{a.id}</td>
                <td className="p-3 font-medium text-slate-200">{a.name}</td>
                <td className="p-3">
                  <Badge variant={a.category === 'INTERNAL' ? 'info' : 'primary'} size="sm">
                    {a.category}
                  </Badge>
                </td>
                <td className="p-3 font-mono text-slate-400 text-[11px] truncate max-w-xs">{a.endpoint}</td>
                <td className="p-3 font-mono text-emerald-400">{a.latency}</td>
                <td className="p-3">
                  <button
                    onClick={() => setApiList(apiList.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)))}
                    className="cursor-pointer"
                  >
                    <Badge variant={a.active ? 'success' : 'neutral'} size="sm" dot={true}>
                      {a.active ? '활성 (ACTIVE)' : '비활성 (OFF)'}
                    </Badge>
                  </button>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center items-center gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(a)} className="text-xs px-2.5 py-1">수정</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(a.id)} className="text-xs px-2.5 py-1">삭제</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="block md:hidden space-y-2">
        {filteredApis.map((a) => (
          <Card key={a.id} variant="subtle" className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-indigo-300">{a.id}</span>
              <button
                onClick={() => setApiList(apiList.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)))}
                className="cursor-pointer"
              >
                <Badge variant={a.active ? 'success' : 'neutral'} size="sm" dot={true}>
                  {a.active ? '활성' : '비활성'}
                </Badge>
              </button>
            </div>
            <div className="font-bold text-slate-200 text-sm">{a.name}</div>
            <div className="text-[11px] font-mono text-slate-400 break-all">{a.endpoint}</div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <Badge variant={a.category === 'INTERNAL' ? 'info' : 'primary'} size="sm">{a.category}</Badge>
              <span className="text-emerald-400">{a.latency}</span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-900">
              <Button variant="secondary" size="sm" onClick={() => openEdit(a)} className="flex-1 text-xs">수정</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(a.id)} className="flex-1 text-xs">삭제</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* API 등록 및 수정 팝업 모달 */}
      <Modal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={editingApi ? `✏️ API 수정: [${editingApi.id}]` : '🌐 신규 API 엔드포인트 등록'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setShowApiModal(false)}>취소</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>저장 완료</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <Input
              label="API 명칭"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="예: 실시간 워터마크 API"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">구분</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
            >
              <option value="INTERNAL">내부 서비스 API (INTERNAL)</option>
              <option value="EXTERNAL">외부 연동 API (EXTERNAL)</option>
            </select>
          </div>

          <div>
            <Input
              label="엔드포인트 URL"
              value={formEndpoint}
              onChange={(e) => setFormEndpoint(e.target.value)}
              placeholder="/api/... or https://..."
              className="font-mono"
            />
          </div>

          <div>
            <Input
              label="자격증명 토큰 / 키"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              placeholder="API Key or Secret Token"
              className="font-mono"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="apiActive"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              className="accent-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="apiActive" className="text-slate-300 cursor-pointer">
              즉시 활성화 (사용 여부)
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// PG-ADM-12: 공지, 배너 등 게시판 관리 (요청 1 반영: 다중행 텍스트, 제목/첨부파일/게시기간/순서 지원)
// ============================================================================
export interface BoardNoticeItem {
  id: string;
  title: string;
  content: string; // 여러줄 본문 내용
  attachmentName?: string; // 첨부파일
  startDate: string; // 게시 시작일
  endDate: string; // 게시 종료일
  isScheduled: boolean;
  scheduleDate: string;
  dismissOption: string;
  active: boolean; // 사용여부
}

export interface BoardBannerItem {
  id: string;
  title: string;
  content: string; // 여러줄 텍스트 배너 설명
  attachmentName?: string; // 이미지/배너 첨부파일
  type: string;
  order: number;
  active: boolean; // 사용여부
}

export function AdminBoardsAndBannersView() {
  const [boardTab, setBoardTab] = useState<'NOTICES' | 'BANNERS'>('NOTICES');

  // 공지사항
  const [notices, setNotices] = useState<BoardNoticeItem[]>([
    {
      id: 'POST-01',
      title: '추석 연휴 고객센터 운영 및 시스템 정기점검 안내',
      content: '연휴 기간 동안 1:1 상담 접수는 정상 진행되나 답변 처리는 10월 10일부터 순차적으로 진행됩니다.\n긴급 장애 발생 시 비상 대응 모니터링이 가동됩니다.',
      attachmentName: 'notice_chuseok_guide.pdf (1.2 MB)',
      startDate: '2026-10-01',
      endDate: '2026-10-15',
      isScheduled: true,
      scheduleDate: '2026-10-07 00:00',
      dismissOption: '하루 동안 열지 않기',
      active: true,
    },
    {
      id: 'POST-02',
      title: '신규 PDF 텍스트 교정기 및 3-Way 충돌머지 출시 안내',
      content: '오프라인에서 수정한 주석과 클라우드 최신본 간의 충돌을 자동으로 시각화하여 병합하는 신기능이 적용되었습니다.',
      attachmentName: 'merge_engine_v2_spec.pdf (820 KB)',
      startDate: '2026-10-05',
      endDate: '2026-12-31',
      isScheduled: false,
      scheduleDate: '즉시',
      dismissOption: '7일 동안 열지 않기',
      active: true,
    },
  ]);

  // 롤링 배너
  const [banners, setBanners] = useState<BoardBannerItem[]>([
    {
      id: 'BNR-01',
      title: '800쪽 대용량 가상 뷰어 무한스크롤',
      content: 'DOM 재활용 가상화 엔진으로 메모리 누수 없이 800페이지 이상의 문서를 즉각 탐색하세요.',
      attachmentName: 'banner_virtual_scroll.png (340 KB)',
      type: '이미지 배너',
      order: 1,
      active: true,
    },
    {
      id: 'BNR-02',
      title: '오프라인 상태에서도 안심! 3-Way 스마트 머지',
      content: '네트워크 단절 상황에서도 IndexedDB에 안전 격리 보존되며 재연결 시 원클릭 병합됩니다.',
      attachmentName: 'banner_offline_merge.svg (45 KB)',
      type: '텍스트 배너',
      order: 2,
      active: true,
    },
  ]);

  // 공지사항 모달 상태
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<BoardNoticeItem | null>(null);
  const [noticeFormTitle, setNoticeFormTitle] = useState('');
  const [noticeFormContent, setNoticeFormContent] = useState('');
  const [noticeFormAttachment, setNoticeFormAttachment] = useState('');
  const [noticeFormStartDate, setNoticeFormStartDate] = useState('2026-10-01');
  const [noticeFormEndDate, setNoticeFormEndDate] = useState('2026-10-31');
  const [noticeFormDate, setNoticeFormDate] = useState('2026-10-15 09:00');
  const [noticeFormIsScheduled, setNoticeFormIsScheduled] = useState(true);
  const [noticeFormDismiss, setNoticeFormDismiss] = useState('하루 동안 열지 않기 (24시간)');
  const [noticeFormActive, setNoticeFormActive] = useState(true);

  // 배너 모달 상태
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BoardBannerItem | null>(null);
  const [bannerFormTitle, setBannerFormTitle] = useState('');
  const [bannerFormContent, setBannerFormContent] = useState('');
  const [bannerFormAttachment, setBannerFormAttachment] = useState('');
  const [bannerFormType, setBannerFormType] = useState('이미지 배너');
  const [bannerFormOrder, setBannerFormOrder] = useState(1);
  const [bannerFormActive, setBannerFormActive] = useState(true);

  // Notice Handlers
  const openCreateNotice = () => {
    setEditingNotice(null);
    setNoticeFormTitle('');
    setNoticeFormContent('');
    setNoticeFormAttachment('');
    setNoticeFormStartDate('2026-10-06');
    setNoticeFormEndDate('2026-10-20');
    setNoticeFormDate('2026-10-15 09:00');
    setNoticeFormIsScheduled(false);
    setNoticeFormDismiss('하루 동안 열지 않기 (24시간)');
    setNoticeFormActive(true);
    setShowNoticeModal(true);
  };

  const openEditNotice = (n: BoardNoticeItem) => {
    setEditingNotice(n);
    setNoticeFormTitle(n.title);
    setNoticeFormContent(n.content || '');
    setNoticeFormAttachment(n.attachmentName || '');
    setNoticeFormStartDate(n.startDate || '2026-10-01');
    setNoticeFormEndDate(n.endDate || '2026-10-31');
    setNoticeFormDate(n.scheduleDate);
    setNoticeFormIsScheduled(n.isScheduled);
    setNoticeFormDismiss(n.dismissOption);
    setNoticeFormActive(n.active);
    setShowNoticeModal(true);
  };

  const handleSaveNotice = () => {
    if (!noticeFormTitle.trim()) return;
    if (editingNotice) {
      setNotices(
        notices.map((n) =>
          n.id === editingNotice.id
            ? {
                ...n,
                title: noticeFormTitle,
                content: noticeFormContent,
                attachmentName: noticeFormAttachment || n.attachmentName,
                startDate: noticeFormStartDate,
                endDate: noticeFormEndDate,
                isScheduled: noticeFormIsScheduled,
                scheduleDate: noticeFormIsScheduled ? noticeFormDate : '즉시',
                dismissOption: noticeFormDismiss,
                active: noticeFormActive,
              }
            : n
        )
      );
    } else {
      setNotices([
        ...notices,
        {
          id: `POST-0${notices.length + 1}`,
          title: noticeFormTitle,
          content: noticeFormContent,
          attachmentName: noticeFormAttachment || '첨부파일_미등록.pdf',
          startDate: noticeFormStartDate,
          endDate: noticeFormEndDate,
          isScheduled: noticeFormIsScheduled,
          scheduleDate: noticeFormIsScheduled ? noticeFormDate : '즉시',
          dismissOption: noticeFormDismiss,
          active: noticeFormActive,
        },
      ]);
    }
    setShowNoticeModal(false);
  };

  // Banner Handlers
  const openCreateBanner = () => {
    setEditingBanner(null);
    setBannerFormTitle('');
    setBannerFormContent('');
    setBannerFormAttachment('');
    setBannerFormType('이미지 배너');
    setBannerFormOrder(banners.length + 1);
    setBannerFormActive(true);
    setShowBannerModal(true);
  };

  const openEditBanner = (b: BoardBannerItem) => {
    setEditingBanner(b);
    setBannerFormTitle(b.title);
    setBannerFormContent(b.content || '');
    setBannerFormAttachment(b.attachmentName || '');
    setBannerFormType(b.type);
    setBannerFormOrder(b.order);
    setBannerFormActive(b.active);
    setShowBannerModal(true);
  };

  const handleSaveBanner = () => {
    if (!bannerFormTitle.trim()) return;
    if (editingBanner) {
      setBanners(
        banners.map((b) =>
          b.id === editingBanner.id
            ? {
                ...b,
                title: bannerFormTitle,
                content: bannerFormContent,
                attachmentName: bannerFormAttachment || b.attachmentName,
                type: bannerFormType,
                order: bannerFormOrder,
                active: bannerFormActive,
              }
            : b
        )
      );
    } else {
      setBanners([
        ...banners,
        {
          id: `BNR-0${banners.length + 1}`,
          title: bannerFormTitle,
          content: bannerFormContent,
          attachmentName: bannerFormAttachment || 'banner_asset.png',
          type: bannerFormType,
          order: bannerFormOrder,
          active: bannerFormActive,
        },
      ]);
    }
    setShowBannerModal(false);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex gap-2">
          <Button
            variant={boardTab === 'NOTICES' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setBoardTab('NOTICES')}
            className="text-xs"
          >
            📢 공지사항 (예약공지 & 팝업 다시열지않기)
          </Button>
          <Button
            variant={boardTab === 'BANNERS' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setBoardTab('BANNERS')}
            className="text-xs"
          >
            🖼️ 롤링 배너 (텍스트/이미지 순서 & 사용여부)
          </Button>
        </div>
        <div>
          {boardTab === 'NOTICES' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateNotice}
              className="text-xs"
            >
              + 공지사항 등록
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateBanner}
              className="text-xs"
            >
              + 신규 배너 등록
            </Button>
          )}
        </div>
      </div>

      {boardTab === 'NOTICES' ? (
        <div className="space-y-3">
          {/* 데스크톱 테이블 */}
          <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden shadow">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">공지 제목</th>
                  <th className="p-3">발행 일정</th>
                  <th className="p-3">다시열지않기 팝업 옵션</th>
                  <th className="p-3">사용 여부</th>
                  <th className="p-3 text-center">관리 조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {notices.map((n) => (
                  <tr key={n.id}>
                    <td className="p-3 font-mono font-bold text-indigo-300">{n.id}</td>
                    <td className="p-3 font-medium text-slate-200">{n.title}</td>
                    <td className="p-3 text-emerald-400">{n.scheduleDate}</td>
                    <td className="p-3 text-slate-400">{n.dismissOption}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setNotices(notices.map((x) => (x.id === n.id ? { ...x, active: !x.active } : x)))}
                        className="cursor-pointer"
                      >
                        <Badge variant={n.active ? 'success' : 'neutral'} size="sm" dot={true}>
                          {n.active ? '사용중' : '미사용'}
                        </Badge>
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditNotice(n)}
                          className="px-2.5 py-1 text-xs"
                        >
                          수정
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setNotices(notices.filter((x) => x.id !== n.id))}
                          className="px-2.5 py-1 text-xs"
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 뷰 */}
          <div className="block md:hidden space-y-2">
            {notices.map((n) => (
              <Card key={n.id} variant="subtle" className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-indigo-300">{n.id}</span>
                  <button
                    onClick={() => setNotices(notices.map((x) => (x.id === n.id ? { ...x, active: !x.active } : x)))}
                    className="cursor-pointer"
                  >
                    <Badge variant={n.active ? 'success' : 'neutral'} size="sm" dot={true}>
                      {n.active ? '사용중' : '미사용'}
                    </Badge>
                  </button>
                </div>
                <div className="font-bold text-slate-200">{n.title}</div>
                <div className="text-[11px] text-slate-400">옵션: {n.dismissOption}</div>
                <div className="text-[11px] text-emerald-400">일정: {n.scheduleDate}</div>
                <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-900">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditNotice(n)}
                    className="text-xs flex-1"
                  >
                    수정
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setNotices(notices.filter((x) => x.id !== n.id))}
                    className="text-xs flex-1"
                  >
                    삭제
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 데스크톱 테이블 */}
          <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">노출 순서</th>
                  <th className="p-3">배너 제목 / 컨텐츠</th>
                  <th className="p-3">배너 유형</th>
                  <th className="p-3">사용 여부</th>
                  <th className="p-3 text-center">관리 조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {banners.map((b, idx) => (
                  <tr key={b.id}>
                    <td className="p-3 font-mono font-bold text-emerald-400">순서 #{b.order}</td>
                    <td className="p-3 font-bold text-slate-200">{b.title}</td>
                    <td className="p-3 text-slate-400">{b.type}</td>
                    <td className="p-3">
                      <button
                        onClick={() => setBanners(banners.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)))}
                        className="cursor-pointer"
                      >
                        <Badge variant={b.active ? 'success' : 'neutral'} size="sm" dot={true}>
                          {b.active ? '사용중' : '미사용'}
                        </Badge>
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (idx > 0) {
                              const copy = [...banners];
                              const temp = copy[idx];
                              copy[idx] = copy[idx - 1];
                              copy[idx - 1] = temp;
                              copy.forEach((item, i) => (item.order = i + 1));
                              setBanners(copy);
                            }
                          }}
                          className="px-2 py-0.5 text-xs"
                        >
                          ▲
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (idx < banners.length - 1) {
                              const copy = [...banners];
                              const temp = copy[idx];
                              copy[idx] = copy[idx + 1];
                              copy[idx + 1] = temp;
                              copy.forEach((item, i) => (item.order = i + 1));
                              setBanners(copy);
                            }
                          }}
                          className="px-2 py-0.5 text-xs"
                        >
                          ▼
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditBanner(b)}
                          className="px-2.5 py-1 text-xs ml-1"
                        >
                          수정
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setBanners(banners.filter((x) => x.id !== b.id))}
                          className="px-2.5 py-1 text-xs"
                        >
                          삭제
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 뷰 */}
          <div className="block md:hidden space-y-2">
            {banners.map((b) => (
              <Card key={b.id} variant="subtle" className="p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-emerald-400 font-bold">순서 #{b.order}</span>
                  <button
                    onClick={() => setBanners(banners.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)))}
                    className="cursor-pointer"
                  >
                    <Badge variant={b.active ? 'success' : 'neutral'} size="sm" dot={true}>
                      {b.active ? '사용중' : '미사용'}
                    </Badge>
                  </button>
                </div>
                <div className="font-bold text-slate-200">{b.title}</div>
                <div className="text-[11px] text-slate-400">{b.type}</div>
                <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-900">
                  <Button variant="secondary" size="sm" onClick={() => openEditBanner(b)} className="text-xs flex-1">
                    수정
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setBanners(banners.filter((x) => x.id !== b.id))} className="text-xs flex-1">
                    삭제
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 공지 등록 및 수정 모달 */}
      <Modal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        title={editingNotice ? `✏️ 공지사항 수정: [${editingNotice.id}]` : '📢 신규 공지사항 작성'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setShowNoticeModal(false)}>취소</Button>
            <Button variant="primary" size="sm" onClick={handleSaveNotice}>저장</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <Input
              label="공지 제목"
              value={noticeFormTitle}
              onChange={(e) => setNoticeFormTitle(e.target.value)}
              placeholder="예: 서버 정기 점검 일정 안내"
            />
          </div>

          <div>
            <Textarea
              label="공지 본문 내용 (다중행 텍스트)"
              rows={3}
              value={noticeFormContent}
              onChange={(e) => setNoticeFormContent(e.target.value)}
              placeholder="공지사항 상세 본문 내용을 여러 줄로 입력하세요..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Input
                label="게시 시작일"
                type="date"
                value={noticeFormStartDate}
                onChange={(e) => setNoticeFormStartDate(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Input
                label="게시 종료일"
                type="date"
                value={noticeFormEndDate}
                onChange={(e) => setNoticeFormEndDate(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">첨부파일</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={noticeFormAttachment}
                onChange={(e) => setNoticeFormAttachment(e.target.value)}
                placeholder="첨부파일명 또는 파일 선택 (예: notice_guide.pdf)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs font-mono"
              />
              <label className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg cursor-pointer text-xs border border-slate-700 whitespace-nowrap">
                파일 첨부
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNoticeFormAttachment(e.target.files[0].name + ` (${(e.target.files[0].size / 1024).toFixed(0)} KB)`);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">다시열지않기 팝업 옵션</label>
            <select
              value={noticeFormDismiss}
              onChange={(e) => setNoticeFormDismiss(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
            >
              <option>하루 동안 열지 않기 (24시간)</option>
              <option>7일 동안 열지 않기 (일주일)</option>
              <option>30일 동안 열지 않기 (한달)</option>
              <option>다시 보지 않기 (영구)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="noticeSched"
              checked={noticeFormIsScheduled}
              onChange={(e) => setNoticeFormIsScheduled(e.target.checked)}
              className="accent-indigo-500 w-4 h-4"
            />
            <label htmlFor="noticeSched" className="text-slate-300 cursor-pointer">
              예약 발행 활성화
            </label>
          </div>

          {noticeFormIsScheduled && (
            <div>
              <Input
                label="예약 발행 일시"
                value={noticeFormDate}
                onChange={(e) => setNoticeFormDate(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm"
                className="font-mono"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="noticeAct"
              checked={noticeFormActive}
              onChange={(e) => setNoticeFormActive(e.target.checked)}
              className="accent-indigo-500 w-4 h-4"
            />
            <label htmlFor="noticeAct" className="text-slate-300 cursor-pointer">
              즉시 활성화 (사용 여부)
            </label>
          </div>
        </div>
      </Modal>

      {/* 배너 등록 및 수정 모달 (가로 튐 완전 방지) */}
      <Modal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        title={editingBanner ? `✏️ 롤링 배너 수정: [${editingBanner.id}]` : '🖼️ 신규 롤링 배너 등록'}
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setShowBannerModal(false)}>취소</Button>
            <Button variant="primary" size="sm" onClick={handleSaveBanner}>저장</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <Input
              label="배너 문구 및 제목"
              value={bannerFormTitle}
              onChange={(e) => setBannerFormTitle(e.target.value)}
              placeholder="예: 스마트 뷰어 AI 주석 어시스턴트"
            />
          </div>

          <div>
            <Textarea
              label="배너 본문 및 설명 (다중행 텍스트)"
              rows={3}
              value={bannerFormContent}
              onChange={(e) => setBannerFormContent(e.target.value)}
              placeholder="배너 상세 설명 및 카피 문구를 여러 줄로 입력하세요..."
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">배너 이미지 / 첨부파일</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={bannerFormAttachment}
                onChange={(e) => setBannerFormAttachment(e.target.value)}
                placeholder="이미지 파일명 또는 파일 선택 (예: banner_hero.png)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs font-mono"
              />
              <label className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg cursor-pointer text-xs border border-slate-700 whitespace-nowrap">
                이미지 첨부
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setBannerFormAttachment(e.target.files[0].name + ` (${(e.target.files[0].size / 1024).toFixed(0)} KB)`);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">배너 유형</label>
              <select
                value={bannerFormType}
                onChange={(e) => setBannerFormType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
              >
                <option>이미지 배너</option>
                <option>텍스트 배너</option>
              </select>
            </div>
            <div>
              <Input
                label="노출 우선순위"
                type="number"
                value={bannerFormOrder}
                onChange={(e) => setBannerFormOrder(parseInt(e.target.value) || 1)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="bannerAct"
              checked={bannerFormActive}
              onChange={(e) => setBannerFormActive(e.target.checked)}
              className="accent-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="bannerAct" className="text-slate-300 cursor-pointer">
              즉시 활성화 (사용 여부)
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// PG-ADM-13: 고객관리 (요청 14: FAQ CRUD/그룹/순서, QNA & 1:1문의 2-depth 답글기능)
// ============================================================================
export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
}

export interface TicketItem {
  id: string;
  type: 'QNA' | 'INQUIRY';
  author: string;
  question: string;
  date: string;
  reply?: {
    replier: string;
    answer: string;
    repliedAt: string;
  };
}

export function AdminCustomerSupportView() {
  const [supportTab, setSupportTab] = useState<'FAQ' | 'QNA' | 'INQUIRY'>('FAQ');

  // FAQ State
  const [faqs, setFaqs] = useState<FaqItem[]>([
    { id: 'FAQ-01', category: '뷰어/오프라인', question: '네트워크가 끊겨도 PDF 주석 작업이 가능한가요?', answer: '네, 오프라인 토큰 기간 동안 브라우저 로컬 IndexedDB에 자동 격리 저장되며 재연결 시 3-Way 머지됩니다.', order: 1 },
    { id: 'FAQ-02', category: 'OCR서비스', question: '스캔된 이미지 PDF의 텍스트 인식률은 어느 정도인가요?', answer: 'Tesseract 및 Gemini Vision 듀얼 엔진을 통해 한글/영문 99.2% 이상의 정밀도를 제공합니다.', order: 2 },
    { id: 'FAQ-03', category: '계정/보안', question: '2단계 인증(OTP) 분실 시 어떻게 복구하나요?', answer: '로그인 시 발급받은 8자리 비상복구코드를 입력하거나 관리자 초기화 링크 발송을 요청하세요.', order: 3 },
  ]);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('ALL');
  const [newFaqCat, setNewFaqCat] = useState('뷰어/오프라인');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Q&A / 1:1 Tickets with 2-Depth Reply
  const [tickets, setTickets] = useState<TicketItem[]>([
    {
      id: 'TKT-QNA-01',
      type: 'QNA',
      author: 'user_0921@corp.com',
      question: '커스텀 폰트 WOFF2 추가 등록 방법 문의 드립니다.',
      date: '2026-10-04',
      reply: {
        replier: '관리자 (운영팀)',
        answer: '시스템설정 > 무료글꼴관리 메뉴에서 WOFF2 파일을 업로드하고 [적용하기]를 누르시면 즉시 뷰어에 반영됩니다.',
        repliedAt: '2026-10-04 15:30',
      },
    },
    {
      id: 'TKT-QNA-02',
      type: 'QNA',
      author: 'office_worker@company.co.kr',
      question: '대용량 PDF 문서 로딩 시 브라우저 메모리 한도 설정이 가능한가요?',
      date: '2026-10-06',
      // No reply yet - explicit pending for reply button
    },
    {
      id: 'TKT-QNA-03',
      type: 'QNA',
      author: 'legal_doc@lawfirm.kr',
      question: 'PDF 전자서명 날인 시 시각 인증 타임스탬프(TSA) 연동 규격 문의',
      date: '2026-10-06',
      // No reply yet
    },
    {
      id: 'TKT-INQ-01',
      type: 'INQUIRY',
      author: 'dev_lead@purepdf.kr',
      question: '[비공개] NAS 스토리지 대용량 동기화 실패 건 문의',
      date: '2026-10-05',
      // No reply yet
    },
    {
      id: 'TKT-INQ-02',
      type: 'INQUIRY',
      author: 'enterprise_sec@bank.com',
      question: '[비공개] 금융망 폐쇄망 전용 2FA 토큰 오프라인 검증 로직 지원 요청',
      date: '2026-10-06',
      reply: {
        replier: '보안아키텍트',
        answer: '보안관리(PG-ADM-01) 화면의 [오프라인 토큰 발급] 기능과 WASM Core 서명 검증 모듈을 통해 금융망 독립 동작이 가능합니다.',
        repliedAt: '2026-10-06 11:20',
      },
    },
  ]);

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  // 신규 Q&A / 1:1 상담 등록 모달 상태
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionAuthor, setNewQuestionAuthor] = useState('');

  // FAQ 수정 모달 상태
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [editFaqQ, setEditFaqQ] = useState('');
  const [editFaqA, setEditFaqA] = useState('');
  const [editFaqCat, setEditFaqCat] = useState('뷰어/오프라인');

  const handleAddReply = (ticketId: string) => {
    if (!replyInputText.trim()) return;
    setTickets(
      tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              reply: {
                replier: '관리자 (운영팀)',
                answer: replyInputText,
                repliedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              },
            }
          : t
      )
    );
    setActiveReplyId(null);
    setReplyInputText('');
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;
    const copy = [...faqs];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    copy.forEach((item, idx) => (item.order = idx + 1));
    setFaqs(copy);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
        <Button
          variant={supportTab === 'FAQ' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSupportTab('FAQ')}
          className="text-xs"
        >
          ❓ FAQ 관리 (질문·답변 & 그룹 & 순서)
        </Button>
        <Button
          variant={supportTab === 'QNA' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSupportTab('QNA')}
          className="text-xs"
        >
          💬 공개 Q&A (2-Depth 답글 지원)
        </Button>
        <Button
          variant={supportTab === 'INQUIRY' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSupportTab('INQUIRY')}
          className="text-xs"
        >
          🔒 1:1 비공개 상담 (2-Depth 답글 지원)
        </Button>
      </div>

      {/* 1. FAQ 관리 */}
      {supportTab === 'FAQ' && (
        <div className="space-y-3">
          {/* FAQ 등록 폼 */}
          <Card variant="subtle" className="p-3.5 space-y-2">
            <span className="font-bold text-white text-xs">신규 FAQ 등록</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={newFaqCat}
                onChange={(e) => setNewFaqCat(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
              >
                <option value="뷰어/오프라인">뷰어/오프라인</option>
                <option value="OCR서비스">OCR서비스</option>
                <option value="계정/보안">계정/보안</option>
                <option value="결제/구독">결제/구독</option>
              </select>
              <div className="sm:col-span-3">
                <Input
                  placeholder="질문 제목 입력"
                  value={newFaqQ}
                  onChange={(e) => setNewFaqQ(e.target.value)}
                />
              </div>
            </div>
            <Textarea
              rows={2}
              placeholder="상세 답변 내용 입력"
              value={newFaqA}
              onChange={(e) => setNewFaqA(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (newFaqQ && newFaqA) {
                    setFaqs([
                      ...faqs,
                      {
                        id: `FAQ-0${faqs.length + 1}`,
                        category: newFaqCat,
                        question: newFaqQ,
                        answer: newFaqA,
                        order: faqs.length + 1,
                      },
                    ]);
                    setNewFaqQ('');
                    setNewFaqA('');
                  }
                }}
                className="text-xs"
              >
                저장
              </Button>
            </div>
          </Card>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-slate-400 text-[11px]">카테고리:</span>
            {['ALL', '뷰어/오프라인', 'OCR서비스', '계정/보안', '결제/구독'].map((c) => (
              <Button
                key={c}
                variant={faqCategoryFilter === c ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFaqCategoryFilter(c)}
                className="text-xs px-2.5 py-1"
              >
                {c === 'ALL' ? '전체' : c}
              </Button>
            ))}
          </div>

          {/* FAQ 목록 및 순서 조정 */}
          <div className="space-y-2">
            {faqs
              .filter((f) => (faqCategoryFilter === 'ALL' ? true : f.category === faqCategoryFilter))
              .map((f, idx) => (
                <Card key={f.id} variant="subtle" className="p-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Badge variant="primary" size="sm">
                      #{f.order} {f.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleMoveFaq(idx, 'up')} className="px-2 py-0.5 text-xs">▲</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleMoveFaq(idx, 'down')} className="px-2 py-0.5 text-xs">▼</Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingFaq(f);
                          setEditFaqQ(f.question);
                          setEditFaqA(f.answer);
                          setEditFaqCat(f.category);
                        }}
                        className="px-2.5 py-0.5 text-xs ml-1"
                      >
                        수정
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setFaqs(faqs.filter((x) => x.id !== f.id))} className="px-2.5 py-0.5 text-xs ml-1">삭제</Button>
                    </div>
                  </div>
                  <div className="font-bold text-slate-200 text-sm">Q. {f.question}</div>
                  <div className="text-slate-400 text-xs whitespace-pre-wrap">{f.answer}</div>
                </Card>
              ))}
          </div>

          {/* FAQ 수정 전용 팝업 모달 (요청 4 반영) */}
          <Modal
            isOpen={!!editingFaq}
            onClose={() => setEditingFaq(null)}
            title={editingFaq ? `✏️ FAQ 수정: [${editingFaq.id}]` : ''}
            size="md"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="secondary" size="sm" onClick={() => setEditingFaq(null)}>취소</Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (editFaqQ.trim() && editFaqA.trim()) {
                      setFaqs(faqs.map(x => x.id === editingFaq?.id ? { ...x, category: editFaqCat, question: editFaqQ, answer: editFaqA } : x));
                      setEditingFaq(null);
                    }
                  }}
                >
                  저장
                </Button>
              </div>
            }
          >
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">카테고리</label>
                <select
                  value={editFaqCat}
                  onChange={(e) => setEditFaqCat(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
                >
                  <option value="뷰어/오프라인">뷰어/오프라인</option>
                  <option value="OCR서비스">OCR서비스</option>
                  <option value="계정/보안">계정/보안</option>
                  <option value="결제/구독">결제/구독</option>
                </select>
              </div>

              <div>
                <Input
                  label="질문 제목"
                  value={editFaqQ}
                  onChange={(e) => setEditFaqQ(e.target.value)}
                />
              </div>

              <div>
                <Textarea
                  label="상세 답변"
                  rows={3}
                  value={editFaqA}
                  onChange={(e) => setEditFaqA(e.target.value)}
                />
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* 2 & 3. QNA 및 1:1 상담 (2-Depth 답글 구조 - 요청 3: Q&A 답글 버튼 및 수정 보강) */}
      {(supportTab === 'QNA' || supportTab === 'INQUIRY') && (
        <div className="space-y-3">
          <Card variant="subtle" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-950/40 border border-indigo-500/30">
            <div className="text-indigo-300 text-[11px]">
              💡 <strong>[2-Depth 단일 스레드 설계]</strong>: 고객 문의(Depth 1)에 대한 관리자 공인 답변(Depth 2)으로 무한 댓글을 방지하고 공식 답변의 신뢰도를 유지합니다.
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setNewQuestionTitle('');
                setNewQuestionAuthor('user_' + Math.floor(1000 + Math.random() * 9000) + '@company.com');
                setShowNewQuestionModal(true);
              }}
              leftIcon={<span>+</span>}
              className="text-xs shrink-0 self-start sm:self-auto"
            >
              신규 {supportTab === 'QNA' ? 'Q&A 질문' : '1:1 상담'} 등록
            </Button>
          </Card>

          <div className="space-y-3">
            {tickets
              .filter((t) => t.type === supportTab)
              .map((t) => (
                <Card key={t.id} variant="subtle" className="p-4 space-y-3 shadow-md">
                  {/* Depth 1: 고객 질의 */}
                  <div className="space-y-1.5 border-b border-slate-900 pb-2.5">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-300 font-bold">{t.id}</span>
                        <Badge variant={t.reply ? 'success' : 'warning'} size="sm">
                          {t.reply ? '✓ 답변완료' : '⚠️ 답변대기'}
                        </Badge>
                        <span className="text-[10px] font-mono text-slate-500">{t.date} | 작성자: {t.author}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant={t.reply ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => {
                            setActiveReplyId(t.id);
                            setReplyInputText(t.reply ? t.reply.answer : '');
                          }}
                          className="text-xs px-3 py-1"
                        >
                          {t.reply ? '답글수정' : '✍️ 답글작성'}
                        </Button>
                        {t.reply && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('등록된 답글을 삭제하시겠습니까?')) {
                                setTickets(tickets.map((x) => (x.id === t.id ? { ...x, reply: undefined } : x)));
                              }
                            }}
                            className="text-xs px-2 py-1"
                          >
                            답글삭제
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="font-bold text-slate-100 text-sm">{t.question}</div>
                  </div>

                  {/* Depth 2: 관리자 답변 */}
                  {t.reply ? (
                    <div className="p-3 bg-slate-900/90 border-l-4 border-indigo-500 rounded-r-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-emerald-400 text-xs">↳ {t.reply.replier} 답변 완료</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">{t.reply.repliedAt} (등록자 알림 발송됨)</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setActiveReplyId(t.id);
                              setReplyInputText(t.reply?.answer || '');
                            }}
                            className="text-[11px] px-2 py-0.5"
                          >
                            답글수정
                          </Button>
                        </div>
                      </div>
                      <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{t.reply.answer}</div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-sm">⚠️</span>
                        <div>
                          <div className="text-amber-300 text-xs font-semibold">관리자 답변 대기 중입니다.</div>
                          <div className="text-[10px] text-slate-400">답글을 작성하여 등록하면 고객에게 알림이 즉시 발송됩니다.</div>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActiveReplyId(t.id);
                          setReplyInputText('');
                        }}
                        leftIcon={<span>✍️</span>}
                        className="text-xs shrink-0 self-end sm:self-auto"
                      >
                        답글작성
                      </Button>
                    </div>
                  )}

                  {/* 답글 작성 및 수정 인라인 폼 */}
                  {activeReplyId === t.id && (
                    <Card variant="subtle" className="p-3 border border-indigo-500/60 rounded-xl space-y-2.5 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-xs">
                          ✍️ {t.reply ? '관리자 공식 답글 수정' : '관리자 공식 답글 작성'} (저장 시 등록자에게 알림 자동 발송)
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setActiveReplyId(null)} className="text-xs">✕ 닫기</Button>
                      </div>
                      <Textarea
                        rows={3}
                        value={replyInputText}
                        onChange={(e) => setReplyInputText(e.target.value)}
                        placeholder="공식 답변 내용을 상세히 입력하세요..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setActiveReplyId(null)} className="text-xs">
                          취소
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddReply(t.id)}
                          className="text-xs"
                        >
                          저장
                        </Button>
                      </div>
                    </Card>
                  )}
                </Card>
              ))}
          </div>

          {/* 신규 Q&A / 1:1 질문 등록 모달 */}
          <Modal
            isOpen={showNewQuestionModal}
            onClose={() => setShowNewQuestionModal(false)}
            title={`💬 신규 ${supportTab === 'QNA' ? 'Q&A 질문' : '1:1 비공개 상담'} 등록`}
            size="md"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="secondary" size="sm" onClick={() => setShowNewQuestionModal(false)}>취소</Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!newQuestionTitle.trim()) return;
                    const prefix = supportTab === 'QNA' ? 'TKT-QNA' : 'TKT-INQ';
                    setTickets([
                      ...tickets,
                      {
                        id: `${prefix}-${String(tickets.length + 1).padStart(2, '0')}`,
                        type: supportTab,
                        author: newQuestionAuthor || 'anonymous_user@company.com',
                        question: newQuestionTitle,
                        date: new Date().toISOString().slice(0, 10),
                      },
                    ]);
                    setShowNewQuestionModal(false);
                    setNewQuestionTitle('');
                  }}
                >
                  저장
                </Button>
              </div>
            }
          >
            <div className="space-y-2.5 text-xs">
              <div>
                <Input
                  label="작성자 계정 (이메일)"
                  value={newQuestionAuthor}
                  onChange={(e) => setNewQuestionAuthor(e.target.value)}
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <Textarea
                  label="문의 제목 및 내용"
                  rows={3}
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  placeholder="질문 내용을 입력하세요..."
                />
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PG-ADM-14: 무료글꼴관리 (요청 15: 등록, 수정, 삭제, 순서 관리, 적용여부, 실시간 프리뷰)
// ============================================================================
export interface FontItem {
  id: string;
  name: string;
  alias: string;
  format: 'WOFF2' | 'TTF' | '다중포맷';
  order: number;
  active: boolean;
  fileNames: string[]; // 다중 글꼴 파일 목록 (요청 5 반영)
}

export function AdminFontsView() {
  const [fonts, setFonts] = useState<FontItem[]>([
    {
      id: 'FNT-01',
      name: 'Pretendard GOV',
      alias: '본고딕 대체형',
      format: 'WOFF2',
      order: 1,
      active: true,
      fileNames: ['Pretendard-Regular.woff2', 'Pretendard-Bold.woff2', 'Pretendard-SemiBold.woff2'],
    },
    {
      id: 'FNT-02',
      name: 'Nanum Myeongjo',
      alias: '나눔명조 전자책용',
      format: 'TTF',
      order: 2,
      active: true,
      fileNames: ['NanumMyeongjo.ttf', 'NanumMyeongjoBold.ttf'],
    },
    {
      id: 'FNT-03',
      name: 'D2Coding',
      alias: '코드 주석용 고정폭',
      format: 'WOFF2',
      order: 3,
      active: false,
      fileNames: ['D2Coding.woff2', 'D2CodingBold.woff2'],
    },
  ]);

  const [previewText, setPreviewText] = useState('가나다라 ABC 123 - purePDFrend 실시간 글꼴 프리뷰');
  const [showFontModal, setShowFontModal] = useState(false);
  const [editingFont, setEditingFont] = useState<FontItem | null>(null);
  const [cardLayout, setCardLayout] = useState<'HORIZONTAL' | 'GRID'>('HORIZONTAL');

  const [formName, setFormName] = useState('');
  const [formAlias, setFormAlias] = useState('');
  const [formFormat, setFormFormat] = useState<'WOFF2' | 'TTF' | '다중포맷'>('WOFF2');
  const [formFiles, setFormFiles] = useState<string[]>([]);

  const openCreate = () => {
    setEditingFont(null);
    setFormName('');
    setFormAlias('');
    setFormFormat('WOFF2');
    setFormFiles([]);
    setShowFontModal(true);
  };

  const openEdit = (f: FontItem) => {
    setEditingFont(f);
    setFormName(f.name);
    setFormAlias(f.alias);
    setFormFormat(f.format);
    setFormFiles(f.fileNames || []);
    setShowFontModal(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    const finalFiles = formFiles.length > 0 ? formFiles : [`${formName}-Regular.woff2`];
    const finalFormat = finalFiles.length > 1 ? '다중포맷' : formFormat;

    if (editingFont) {
      setFonts(
        fonts.map((f) =>
          f.id === editingFont.id
            ? { ...f, name: formName, alias: formAlias, format: finalFormat, fileNames: finalFiles }
            : f
        )
      );
    } else {
      setFonts([
        ...fonts,
        {
          id: `FNT-${String(fonts.length + 1).padStart(2, '0')}`,
          name: formName,
          alias: formAlias,
          format: finalFormat,
          order: fonts.length + 1,
          active: true,
          fileNames: finalFiles,
        },
      ]);
    }
    setShowFontModal(false);
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fonts.length) return;
    const copy = [...fonts];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    copy.forEach((item, idx) => (item.order = idx + 1));
    setFonts(copy);
  };

  return (
    <div className="space-y-4 text-xs">
      <Card variant="subtle" className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="font-bold text-white text-sm">🔤 무료 웹글꼴 관리 (한 글꼴 다중 파일 업로드 지원)</span>
          <p className="text-[11px] text-slate-400 mt-0.5">전자책 및 PDF 주석 텍스트용 웹폰트를 관리하고 한 글꼴 패밀리에 속한 다중 웨이트/포맷 파일을 업로드합니다.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openCreate}
          leftIcon={<span>+</span>}
          className="text-xs shrink-0 self-start sm:self-auto"
        >
          글꼴 등록
        </Button>
      </Card>

      {/* 실시간 텍스트 프리뷰 입력창 및 보기 모드 전환 */}
      <Card variant="subtle" className="p-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-indigo-300">실시간 렌더링 프리뷰 텍스트 입력:</span>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <Button
              variant={cardLayout === 'HORIZONTAL' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCardLayout('HORIZONTAL')}
              className="text-xs px-2.5 py-1"
            >
              ↔️ 가로형 카드 (기본)
            </Button>
            <Button
              variant={cardLayout === 'GRID' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCardLayout('GRID')}
              className="text-xs px-2.5 py-1"
            >
              ⊞ 격자형 카드
            </Button>
          </div>
        </div>
        <Input
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="프리뷰할 텍스트를 입력하세요..."
        />
      </Card>

      {/* 가로형 카드 목록 (요청 1 반영: 세로 대신 넓은 가로형 카드) */}
      {cardLayout === 'HORIZONTAL' ? (
        <div className="space-y-3">
          {fonts.map((f, idx) => (
            <Card
              key={f.id}
              variant="subtle"
              className="p-4 transition-all shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* 좌측: 글꼴 정보 및 파일 목록 */}
              <div className="lg:w-72 space-y-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{f.name}</span>
                  <Badge variant={f.active ? 'success' : 'neutral'} size="sm" dot={true}>
                    {f.active ? '적용중' : '미적용'}
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {f.format}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  <span className="text-amber-400 font-bold mr-1.5">#{f.order}</span>
                  별칭: <strong className="text-slate-300">{f.alias}</strong>
                </div>
                {/* 업로드된 글꼴 파일 칩 목록 */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">첨부 글꼴 파일 ({f.fileNames?.length || 0}개):</span>
                  <div className="flex flex-wrap gap-1">
                    {f.fileNames?.map((fn, fIdx) => (
                      <span key={fIdx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                        📄 {fn}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 중앙: 실시간 렌더링 프리뷰 영역 (가로형으로 넓게 시원하게 표시) */}
              <div className="flex-1 min-w-0 bg-slate-900/90 rounded-lg border border-slate-800 p-3 space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>실시간 폰트 렌더링 프리뷰 ({f.name})</span>
                  <span className="font-mono text-indigo-400">font-family: '{f.name}'</span>
                </div>
                <div
                  className="text-slate-100 text-sm md:text-base leading-relaxed break-words font-medium py-1"
                  style={{ fontFamily: f.name }}
                >
                  {previewText}
                </div>
              </div>

              {/* 우측: 관리 조치 버튼 */}
              <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-900">
                <Button
                  variant={f.active ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => setFonts(fonts.map((x) => (x.id === f.id ? { ...x, active: !x.active } : x)))}
                  className="text-xs px-3 py-1.5"
                >
                  {f.active ? '적용해제' : '뷰어 적용하기'}
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveOrder(idx, 'up')}
                    disabled={idx === 0}
                    className="px-2 py-1 text-xs"
                    title="위로 이동"
                  >
                    ▲
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveOrder(idx, 'down')}
                    disabled={idx === fonts.length - 1}
                    className="px-2 py-1 text-xs"
                    title="아래로 이동"
                  >
                    ▼
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(f)}
                    className="px-2.5 py-1 text-xs"
                  >
                    수정
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setFonts(fonts.filter((x) => x.id !== f.id))}
                    className="px-2.5 py-1 text-xs"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* 격자형 카드 목록 */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fonts.map((f, idx) => (
            <Card key={f.id} variant="subtle" className="p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">{f.name}</span>
                <Badge variant={f.active ? 'success' : 'neutral'} size="sm" dot={true}>
                  {f.active ? '적용중' : '미적용'}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                순번 #{f.order} | 별칭: {f.alias} ({f.format})
              </div>

              {/* 업로드된 글꼴 파일 칩 목록 */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">첨부 글꼴 파일 ({f.fileNames?.length || 0}개):</span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {f.fileNames?.map((fn, fIdx) => (
                    <span key={fIdx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-mono">
                      📄 {fn}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 text-sm truncate" style={{ fontFamily: f.name }}>
                {previewText}
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => moveOrder(idx, 'up')} className="px-2 py-0.5 text-xs">▲</Button>
                  <Button variant="ghost" size="sm" onClick={() => moveOrder(idx, 'down')} className="px-2 py-0.5 text-xs">▼</Button>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(f)} className="px-2.5 py-0.5 text-xs ml-1">수정</Button>
                  <Button variant="danger" size="sm" onClick={() => setFonts(fonts.filter((x) => x.id !== f.id))} className="px-2.5 py-0.5 text-xs">삭제</Button>
                </div>
                <Button
                  variant={f.active ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => setFonts(fonts.map((x) => (x.id === f.id ? { ...x, active: !x.active } : x)))}
                  className="text-[11px] px-2 py-0.5"
                >
                  {f.active ? '적용해제' : '적용하기'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 글꼴 등록 및 수정 모달 (다중 파일 업로드 지원 - 요청 5 반영) */}
      <Modal
        isOpen={showFontModal}
        onClose={() => setShowFontModal(false)}
        title={editingFont ? `✏️ 글꼴 수정: [${editingFont.name}]` : '🔤 신규 무료 웹글꼴 등록'}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setShowFontModal(false)}>취소</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>저장</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div>
            <Input
              label="글꼴 패밀리 명칭"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="예: Pretendard GOV"
            />
          </div>

          <div>
            <Input
              label="글꼴 별명 (Alias)"
              value={formAlias}
              onChange={(e) => setFormAlias(e.target.value)}
              placeholder="예: 본고딕 대체형"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">기본 포맷</label>
            <select
              value={formFormat}
              onChange={(e) => setFormFormat(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 text-xs min-h-[44px] sm:min-h-[36px]"
            >
              <option value="WOFF2">WOFF2 (경량 웹폰트 권장)</option>
              <option value="TTF">TTF (표준 트루타입)</option>
              <option value="다중포맷">다중포맷 (여러 웨이트 파일 동시 등록)</option>
            </select>
          </div>

          {/* 한 글꼴에 글꼴 파일 여러 개 업로드 (요청 5 반영) */}
          <div>
            <label className="text-slate-400 block mb-1">글꼴 파일 다중 첨부 (.woff2, .woff, .ttf, .otf)</label>
            <div className="flex gap-2 items-center">
              <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg cursor-pointer text-xs flex items-center gap-1.5">
                <span>📁 파일 다중 선택</span>
                <input
                  type="file"
                  multiple
                  accept=".woff,.woff2,.ttf,.otf"
                  onChange={(e) => {
                    if (e.target.files) {
                      const names = Array.from(e.target.files).map((file) => file.name);
                      setFormFiles((prev) => [...prev, ...names]);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">선택된 파일: {formFiles.length}개</span>
            </div>

            {formFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800 max-h-24 overflow-y-auto">
                {formFiles.map((fn, fIdx) => (
                  <span key={fIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono">
                    <span>{fn}</span>
                    <button
                      type="button"
                      onClick={() => setFormFiles(formFiles.filter((_, i) => i !== fIdx))}
                      className="text-slate-400 hover:text-rose-400 ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
