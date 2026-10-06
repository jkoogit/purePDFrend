import { useState } from 'react';

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
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex justify-between items-center">
        <div>
          <span className="font-bold text-white text-sm">🔔 알림 관리 (공지 / 서비스 / 개인알림)</span>
          <p className="text-[11px] text-slate-400 mt-0.5">시스템 점검공지 및 OCR 처리완료, 개인보안 알림 템플릿과 사용여부를 관리합니다.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs shadow"
        >
          + 신규 알림 등록
        </button>
      </div>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
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
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[10px] font-mono">{n.type}</span>
                </td>
                <td className="p-3 text-emerald-400">{n.target}</td>
                <td className="p-3 text-slate-400">{n.channel}</td>
                <td className="p-3">
                  <button
                    onClick={() => setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, active: !x.active } : x)))}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      n.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {n.active ? '활성 (사용중)' : '비활성 (정지)'}
                  </button>
                </td>
                <td className="p-3 font-mono text-slate-500">{n.date}</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => openEdit(n)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded">수정</button>
                    <button onClick={() => handleDelete(n.id)} className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded">삭제</button>
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
          <div key={n.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-indigo-300">{n.id}</span>
              <button
                onClick={() => setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, active: !x.active } : x)))}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  n.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {n.active ? '활성' : '비활성'}
              </button>
            </div>
            <div className="font-bold text-slate-200 text-sm">{n.title}</div>
            <div className="text-[11px] text-slate-400">{n.content}</div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>{n.type} | {n.target}</span>
              <span>{n.date}</span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-900">
              <button onClick={() => openEdit(n)} className="flex-1 py-1 bg-slate-800 text-slate-200 rounded text-center">수정</button>
              <button onClick={() => handleDelete(n.id)} className="flex-1 py-1 bg-rose-950 text-rose-300 rounded text-center">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* 알림 생성 및 수정 팝업 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl p-4 sm:p-5 max-w-lg w-full space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">
                {editingItem ? `✏️ 알림 상세 수정 [${editingItem.id}]` : '🔔 신규 알림 등록'}
              </span>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-slate-400 block mb-1">알림 제목</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="예: 정기 서버 점검 안내"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">상세 안내 내용</label>
                <textarea
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="사용자에게 전달할 상세 메시지 입력"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">알림 유형</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="전체 사용자">전체 사용자 (공지)</option>
                    <option value="개인알림 (요청자)">개인알림 (요청자 한정)</option>
                    <option value="관리자 그룹">관리자 전용</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-center pt-1">
                <div>
                  <label className="text-slate-400 block mb-1">발송 채널</label>
                  <input
                    type="text"
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
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

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded">취소</button>
              <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium">저장 완료</button>
            </div>
          </div>
        </div>
      )}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            전체 통합 API ({apiList.length})
          </button>
          <button
            onClick={() => setActiveTab('INTERNAL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'INTERNAL' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            ⚙️ 내부 서비스 API
          </button>
          <button
            onClick={() => setActiveTab('EXTERNAL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'EXTERNAL' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            🌐 외부 연동 API
          </button>
        </div>
        <button
          onClick={openCreate}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow"
        >
          + API 등록
        </button>
      </div>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
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
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    a.category === 'INTERNAL' ? 'bg-sky-500/10 text-sky-400' : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {a.category}
                  </span>
                </td>
                <td className="p-3 font-mono text-slate-400 text-[11px] truncate max-w-xs">{a.endpoint}</td>
                <td className="p-3 font-mono text-emerald-400">{a.latency}</td>
                <td className="p-3">
                  <button
                    onClick={() => setApiList(apiList.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)))}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      a.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {a.active ? '활성 (ACTIVE)' : '비활성 (OFF)'}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-1.5">
                    <button onClick={() => openEdit(a)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded">수정</button>
                    <button onClick={() => handleDelete(a.id)} className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded">삭제</button>
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
          <div key={a.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-indigo-300">{a.id}</span>
              <button
                onClick={() => setApiList(apiList.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)))}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  a.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {a.active ? '활성' : '비활성'}
              </button>
            </div>
            <div className="font-bold text-slate-200 text-sm">{a.name}</div>
            <div className="text-[11px] font-mono text-slate-400 break-all">{a.endpoint}</div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>{a.category}</span>
              <span className="text-emerald-400">{a.latency}</span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-900">
              <button onClick={() => openEdit(a)} className="flex-1 py-1 bg-slate-800 text-slate-200 rounded text-center">수정</button>
              <button onClick={() => handleDelete(a.id)} className="flex-1 py-1 bg-rose-950 text-rose-300 rounded text-center">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* API 등록 및 수정 팝업 모달 */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl p-4 sm:p-5 max-w-lg w-full space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">
                {editingApi ? `✏️ API 수정: [${editingApi.id}]` : '🌐 신규 API 엔드포인트 등록'}
              </span>
              <button onClick={() => setShowApiModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-slate-400 block mb-1">API 명칭</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: 실시간 워터마크 API"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">구분</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  <option value="INTERNAL">내부 서비스 API (INTERNAL)</option>
                  <option value="EXTERNAL">외부 연동 API (EXTERNAL)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">엔드포인트 URL</label>
                <input
                  type="text"
                  value={formEndpoint}
                  onChange={(e) => setFormEndpoint(e.target.value)}
                  placeholder="/api/... or https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">자격증명 토큰 / 키</label>
                <input
                  type="text"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="API Key or Secret Token"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono"
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

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowApiModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded">취소</button>
              <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium">저장 완료</button>
            </div>
          </div>
        </div>
      )}
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
          <button
            onClick={() => setBoardTab('NOTICES')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${boardTab === 'NOTICES' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'}`}
          >
            📢 공지사항 (예약공지 & 팝업 다시열지않기)
          </button>
          <button
            onClick={() => setBoardTab('BANNERS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${boardTab === 'BANNERS' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'}`}
          >
            🖼️ 롤링 배너 (텍스트/이미지 순서 & 사용여부)
          </button>
        </div>
        <div>
          {boardTab === 'NOTICES' ? (
            <button
              onClick={openCreateNotice}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow text-xs"
            >
              + 공지사항 등록
            </button>
          ) : (
            <button
              onClick={openCreateBanner}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow text-xs"
            >
              + 신규 배너 등록
            </button>
          )}
        </div>
      </div>

      {boardTab === 'NOTICES' ? (
        <div className="space-y-3">
          {/* 데스크톱 테이블 */}
          <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
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
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          n.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {n.active ? '사용중' : '미사용'}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => openEditNotice(n)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => setNotices(notices.filter((x) => x.id !== n.id))}
                          className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-[11px]"
                        >
                          삭제
                        </button>
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
              <div key={n.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-indigo-300">{n.id}</span>
                  <button
                    onClick={() => setNotices(notices.map((x) => (x.id === n.id ? { ...x, active: !x.active } : x)))}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      n.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {n.active ? '사용중' : '미사용'}
                  </button>
                </div>
                <div className="font-bold text-slate-200">{n.title}</div>
                <div className="text-[11px] text-slate-400">옵션: {n.dismissOption}</div>
                <div className="text-[11px] text-emerald-400">일정: {n.scheduleDate}</div>
                <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-900">
                  <button
                    onClick={() => openEditNotice(n)}
                    className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setNotices(notices.filter((x) => x.id !== n.id))}
                    className="px-2.5 py-1 bg-rose-950 text-rose-300 rounded text-xs"
                  >
                    삭제
                  </button>
                </div>
              </div>
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
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          b.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {b.active ? '사용중' : '미사용'}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button
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
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded"
                        >
                          ▲
                        </button>
                        <button
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
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => openEditBanner(b)}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded ml-1"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => setBanners(banners.filter((x) => x.id !== b.id))}
                          className="px-2 py-0.5 bg-rose-950 text-rose-300 rounded"
                        >
                          삭제
                        </button>
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
              <div key={b.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-emerald-400 font-bold">순서 #{b.order}</span>
                  <button
                    onClick={() => setBanners(banners.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)))}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      b.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {b.active ? '사용중' : '미사용'}
                  </button>
                </div>
                <div className="font-bold text-slate-200">{b.title}</div>
                <div className="text-[11px] text-slate-400">{b.type}</div>
                <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-900">
                  <button onClick={() => openEditBanner(b)} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                    수정
                  </button>
                  <button onClick={() => setBanners(banners.filter((x) => x.id !== b.id))} className="px-2.5 py-1 bg-rose-950 text-rose-300 rounded text-xs">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 공지 등록 및 수정 모달 */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl p-4 sm:p-5 max-w-lg w-full space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">
                {editingNotice ? `✏️ 공지사항 수정: [${editingNotice.id}]` : '📢 신규 공지사항 작성'}
              </span>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-slate-400 block mb-1">공지 제목</label>
                <input
                  type="text"
                  value={noticeFormTitle}
                  onChange={(e) => setNoticeFormTitle(e.target.value)}
                  placeholder="예: 서버 정기 점검 일정 안내"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">다시열지않기 팝업 옵션</label>
                <select
                  value={noticeFormDismiss}
                  onChange={(e) => setNoticeFormDismiss(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
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
                  <label className="text-slate-400 block mb-1">예약 발행 일시</label>
                  <input
                    type="text"
                    value={noticeFormDate}
                    onChange={(e) => setNoticeFormDate(e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono"
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

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowNoticeModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-400 rounded text-xs">취소</button>
              <button onClick={handleSaveNotice} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs">저장 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 배너 등록 및 수정 모달 (가로 튐 완전 방지) */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl p-4 sm:p-5 max-w-lg w-full space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">
                {editingBanner ? `✏️ 롤링 배너 수정: [${editingBanner.id}]` : '🖼️ 신규 롤링 배너 등록'}
              </span>
              <button onClick={() => setShowBannerModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-slate-400 block mb-1">배너 문구 및 제목</label>
                <input
                  type="text"
                  value={bannerFormTitle}
                  onChange={(e) => setBannerFormTitle(e.target.value)}
                  placeholder="예: 스마트 뷰어 AI 주석 어시스턴트"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">배너 유형</label>
                  <select
                    value={bannerFormType}
                    onChange={(e) => setBannerFormType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                  >
                    <option>이미지 배너</option>
                    <option>텍스트 배너</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">노출 우선순위</label>
                  <input
                    type="number"
                    value={bannerFormOrder}
                    onChange={(e) => setBannerFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bannerAct"
                  checked={bannerFormActive}
                  onChange={(e) => setBannerFormActive(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4"
                />
                <label htmlFor="bannerAct" className="text-slate-300 cursor-pointer">
                  즉시 활성화 (사용 여부)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowBannerModal(false)} className="px-3.5 py-1.5 bg-slate-800 text-slate-400 rounded text-xs">취소</button>
              <button onClick={handleSaveBanner} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs">저장 완료</button>
            </div>
          </div>
        </div>
      )}
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
      id: 'TKT-INQ-01',
      type: 'INQUIRY',
      author: 'dev_lead@purepdf.kr',
      question: '[비공개] NAS 스토리지 대용량 동기화 실패 건 문의',
      date: '2026-10-05',
      // No reply yet
    },
  ]);

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

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
      <div className="flex gap-2 pb-2 border-b border-slate-800">
        <button
          onClick={() => setSupportTab('FAQ')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${supportTab === 'FAQ' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'}`}
        >
          ❓ FAQ 관리 (질문·답변 & 그룹 & 순서)
        </button>
        <button
          onClick={() => setSupportTab('QNA')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${supportTab === 'QNA' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'}`}
        >
          💬 공개 Q&A (2-Depth 답글 지원)
        </button>
        <button
          onClick={() => setSupportTab('INQUIRY')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${supportTab === 'INQUIRY' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-400'}`}
        >
          🔒 1:1 비공개 상담 (2-Depth 답글 지원)
        </button>
      </div>

      {/* 1. FAQ 관리 */}
      {supportTab === 'FAQ' && (
        <div className="space-y-3">
          {/* FAQ 등록 폼 */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-white text-xs">신규 FAQ 등록</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={newFaqCat}
                onChange={(e) => setNewFaqCat(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              >
                <option value="뷰어/오프라인">뷰어/오프라인</option>
                <option value="OCR서비스">OCR서비스</option>
                <option value="계정/보안">계정/보안</option>
                <option value="결제/구독">결제/구독</option>
              </select>
              <input
                type="text"
                placeholder="질문 제목 입력"
                value={newFaqQ}
                onChange={(e) => setNewFaqQ(e.target.value)}
                className="sm:col-span-3 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
            </div>
            <textarea
              rows={2}
              placeholder="상세 답변 내용 입력"
              value={newFaqA}
              onChange={(e) => setNewFaqA(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-slate-200 text-xs"
            />
            <div className="flex justify-end">
              <button
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
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs shadow"
              >
                + FAQ 등록
              </button>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-1.5 items-center">
            <span className="text-slate-400 text-[11px]">카테고리:</span>
            {['ALL', '뷰어/오프라인', 'OCR서비스', '계정/보안', '결제/구독'].map((c) => (
              <button
                key={c}
                onClick={() => setFaqCategoryFilter(c)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  faqCategoryFilter === c ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {c === 'ALL' ? '전체' : c}
              </button>
            ))}
          </div>

          {/* FAQ 목록 및 순서 조정 */}
          <div className="space-y-2">
            {faqs
              .filter((f) => (faqCategoryFilter === 'ALL' ? true : f.category === faqCategoryFilter))
              .map((f, idx) => (
                <div key={f.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 text-[10px] font-mono">
                      #{f.order} {f.category}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => handleMoveFaq(idx, 'up')} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">▲</button>
                      <button onClick={() => handleMoveFaq(idx, 'down')} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">▼</button>
                      <button onClick={() => setFaqs(faqs.filter((x) => x.id !== f.id))} className="px-2 py-0.5 bg-rose-950 text-rose-300 rounded text-xs ml-2">삭제</button>
                    </div>
                  </div>
                  <div className="font-bold text-slate-200 text-sm">Q. {f.question}</div>
                  <div className="text-slate-400 text-xs whitespace-pre-wrap">{f.answer}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 2 & 3. QNA 및 1:1 상담 (2-Depth 답글 구조) */}
      {(supportTab === 'QNA' || supportTab === 'INQUIRY') && (
        <div className="space-y-3">
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-indigo-300 text-[11px]">
            💡 <strong>[2-Depth 단일 스레드 설계 가이드]</strong>: 고객 문의(Depth 1)에 대한 관리자 공인 답변(Depth 2)으로 제한되어 무한 중첩 댓글로 인한 모바일 UI 붕괴를 원천 방지하고 공식 답변의 신뢰도를 유지합니다.
          </div>

          <div className="space-y-3">
            {tickets
              .filter((t) => t.type === supportTab)
              .map((t) => (
                <div key={t.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  {/* Depth 1: 고객 질의 */}
                  <div className="space-y-1 border-b border-slate-900 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-indigo-300 font-bold">{t.id}</span>
                      <span className="text-[10px] font-mono text-slate-500">{t.date} | 작성자: {t.author}</span>
                    </div>
                    <div className="font-bold text-slate-100 text-sm">{t.question}</div>
                  </div>

                  {/* Depth 2: 관리자 답변 */}
                  {t.reply ? (
                    <div className="p-3 bg-slate-900/90 border-l-4 border-indigo-500 rounded-r-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-emerald-400 text-xs">↳ {t.reply.replier} 답변 완료</span>
                        <span className="text-[10px] font-mono text-slate-500">{t.reply.repliedAt} (등록자 알림 발송됨)</span>
                      </div>
                      <div className="text-slate-300 text-xs leading-relaxed">{t.reply.answer}</div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex justify-between items-center">
                      <span className="text-amber-300 text-xs">⚠️ 답변 대기 중입니다.</span>
                      <button
                        onClick={() => {
                          setActiveReplyId(t.id);
                          setReplyInputText('');
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs shadow"
                      >
                        ↳ 공식 답글 작성
                      </button>
                    </div>
                  )}

                  {/* 답글 작성 인라인 폼 */}
                  {activeReplyId === t.id && (
                    <div className="p-3 bg-slate-900 border border-indigo-500/50 rounded-xl space-y-2 animate-fadeIn">
                      <span className="font-bold text-white text-xs">↳ 관리자 답변 작성 (등록 시 작성자에게 알림 자동 발송)</span>
                      <textarea
                        rows={3}
                        value={replyInputText}
                        onChange={(e) => setReplyInputText(e.target.value)}
                        placeholder="공식 답변 내용을 입력하세요..."
                        className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setActiveReplyId(null)} className="px-3 py-1 bg-slate-800 text-slate-400 rounded">취소</button>
                        <button onClick={() => handleAddReply(t.id)} className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium">답글 등록 및 알림 발송</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
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
  format: 'WOFF2' | 'TTF';
  order: number;
  active: boolean;
}

export function AdminFontsView() {
  const [fonts, setFonts] = useState<FontItem[]>([
    { id: 'FNT-01', name: 'Pretendard GOV', alias: '본고딕 대체형', format: 'WOFF2', order: 1, active: true },
    { id: 'FNT-02', name: 'Nanum Myeongjo', alias: '나눔명조 전자책용', format: 'TTF', order: 2, active: true },
    { id: 'FNT-03', name: 'D2Coding', alias: '코드 주석용 고정폭', format: 'WOFF2', order: 3, active: false },
  ]);

  const [previewText, setPreviewText] = useState('가나다라 ABC 123 - purePDFrend 실시간 글꼴 프리뷰');
  const [showFontModal, setShowFontModal] = useState(false);
  const [editingFont, setEditingFont] = useState<FontItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formAlias, setFormAlias] = useState('');
  const [formFormat, setFormFormat] = useState<'WOFF2' | 'TTF'>('WOFF2');

  const openCreate = () => {
    setEditingFont(null);
    setFormName('');
    setFormAlias('');
    setFormFormat('WOFF2');
    setShowFontModal(true);
  };

  const openEdit = (f: FontItem) => {
    setEditingFont(f);
    setFormName(f.name);
    setFormAlias(f.alias);
    setFormFormat(f.format);
    setShowFontModal(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editingFont) {
      setFonts(
        fonts.map((f) =>
          f.id === editingFont.id ? { ...f, name: formName, alias: formAlias, format: formFormat } : f
        )
      );
    } else {
      setFonts([
        ...fonts,
        {
          id: `FNT-${String(fonts.length + 1).padStart(2, '0')}`,
          name: formName,
          alias: formAlias,
          format: formFormat,
          order: fonts.length + 1,
          active: true,
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
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          <span className="font-bold text-white text-sm">🔤 무료 웹글꼴 관리 (등록 / 수정 / 삭제 / 순서 관리)</span>
          <p className="text-[11px] text-slate-400 mt-0.5">전자책 및 PDF 주석 텍스트용 웹폰트를 관리하고 뷰어 노출 순서 및 적용 여부를 제어합니다.</p>
        </div>
        <button onClick={openCreate} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow">
          + 글꼴 등록
        </button>
      </div>

      {/* 실시간 텍스트 프리뷰 입력창 */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
        <span className="font-semibold text-indigo-300">실시간 렌더링 프리뷰 텍스트 입력:</span>
        <input
          type="text"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {fonts.map((f, idx) => (
          <div key={f.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-sm">{f.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${f.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {f.active ? '적용중' : '미적용'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              순번 #{f.order} | 별칭: {f.alias} ({f.format})
            </div>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-slate-200 text-sm truncate">
              {previewText}
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-900">
              <div className="flex gap-1">
                <button onClick={() => moveOrder(idx, 'up')} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">▲</button>
                <button onClick={() => moveOrder(idx, 'down')} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs">▼</button>
                <button onClick={() => openEdit(f)} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs ml-1">수정</button>
                <button onClick={() => setFonts(fonts.filter((x) => x.id !== f.id))} className="px-2 py-0.5 bg-rose-950 text-rose-300 rounded text-xs">삭제</button>
              </div>
              <button
                onClick={() => setFonts(fonts.map((x) => (x.id === f.id ? { ...x, active: !x.active } : x)))}
                className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/40 rounded text-[11px]"
              >
                {f.active ? '적용해제' : '적용하기'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 글꼴 등록 및 수정 모달 */}
      {showFontModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl p-4 sm:p-5 max-w-md w-full space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">
                {editingFont ? `✏️ 글꼴 수정: [${editingFont.name}]` : '🔤 신규 무료 웹글꼴 등록'}
              </span>
              <button onClick={() => setShowFontModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-slate-400 block mb-1">글꼴 명칭</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: Pretendard GOV"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">글꼴 별명 (Alias)</label>
                <input
                  type="text"
                  value={formAlias}
                  onChange={(e) => setFormAlias(e.target.value)}
                  placeholder="예: 본고딕 대체형"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">포맷</label>
                <select
                  value={formFormat}
                  onChange={(e) => setFormFormat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  <option value="WOFF2">WOFF2 (경량 웹폰트 권장)</option>
                  <option value="TTF">TTF (표준 트루타입)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setShowFontModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded">취소</button>
              <button onClick={handleSave} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium">저장 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
