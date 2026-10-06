import { useState } from 'react';

// PG-ADM-05: 사용자권한관리 (3대 서브탭: 권한관리 / 프로그램권한관리 / 사용자권한관리 - 요청 5, 6, 7 반영)
export function AdminRolesView() {
  const [activeSubTab, setActiveSubTab] = useState<'ROLES' | 'PROG_ROLES' | 'USER_ROLES'>('ROLES');

  // 1. 권한 그룹 목록
  const [roleGroups, setRoleGroups] = useState([
    { id: 'ROLE_ADMIN', name: '시스템 총괄 관리자', priority: 1, desc: '모든 기능 및 인프라 접근 전권' },
    { id: 'ROLE_MANAGER', name: '운영 매니저', priority: 2, desc: '고객지원, 공지, 게시판, 메뉴 관리' },
    { id: 'ROLE_EDITOR', name: 'PDF 전문 편집자', priority: 3, desc: '주석 편집, OCR 배치 큐, 내보내기' },
    { id: 'ROLE_USER', name: '일반 회원', priority: 4, desc: '표준 뷰어 및 개인 문서 라이브러리' },
  ]);
  const [selectedRole, setSelectedRole] = useState('ROLE_MANAGER');

  // 2. 프로그램-권한 매핑
  const [rolePrograms, setRolePrograms] = useState<Record<string, string[]>>({
    ROLE_ADMIN: ['PG-ADM-01', 'PG-ADM-02', 'PG-ADM-03', 'PG-ADM-04', 'PG-ADM-05', 'PG-ADM-06', 'PG-USR-01', 'PG-USR-06'],
    ROLE_MANAGER: ['PG-ADM-06', 'PG-ADM-08', 'PG-ADM-12', 'PG-ADM-13', 'PG-USR-01', 'PG-USR-06'],
    ROLE_EDITOR: ['PG-USR-01', 'PG-USR-03', 'PG-USR-05', 'PG-USR-06', 'PG-USR-07'],
    ROLE_USER: ['PG-USR-01', 'PG-USR-02', 'PG-USR-03', 'PG-USR-05', 'PG-USR-06'],
  });

  // 3. 사용자-권한 매핑 (요청 7 반영: 사용자 추가 기능 지원)
  const [roleUsers, setRoleUsers] = useState<Record<string, string[]>>({
    ROLE_ADMIN: ['dev_lead@purepdf.kr'],
    ROLE_MANAGER: ['admin_mgr@purepdf.kr'],
    ROLE_EDITOR: ['user_0921@corp.com', 'dev_lead@purepdf.kr'],
    ROLE_USER: ['guest_8812@gmail.com', 'dormant_user@daum.net'],
  });

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [newAssignUserEmail, setNewAssignUserEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const candidateUsers = [
    'user_0921@corp.com (홍길동)',
    'guest_8812@gmail.com (김영희)',
    'dev_lead@purepdf.kr (이수진)',
    'dormant_user@daum.net (박철수)',
    'operator_01@purepdf.kr (최운영)',
    'qa_tester@purepdf.kr (강테스터)',
  ];

  const allAvailablePrograms = [
    { id: 'PG-ADM-01', name: '보안관리' },
    { id: 'PG-ADM-02', name: '프로그램관리' },
    { id: 'PG-ADM-03', name: '사용자관리' },
    { id: 'PG-ADM-04', name: '약관관리' },
    { id: 'PG-ADM-05', name: '권한관리' },
    { id: 'PG-ADM-06', name: '메뉴관리' },
    { id: 'PG-ADM-08', name: '알림관리' },
    { id: 'PG-ADM-12', name: '게시판·배너관리' },
    { id: 'PG-ADM-13', name: '고객관리' },
    { id: 'PG-USR-01', name: '첫화면' },
    { id: 'PG-USR-05', name: '문서관리' },
    { id: 'PG-USR-06', name: '문서뷰어' },
  ];

  const toggleProgramInRole = (progId: string) => {
    const list = rolePrograms[selectedRole] || [];
    const updated = list.includes(progId) ? list.filter((p) => p !== progId) : [...list, progId];
    setRolePrograms({ ...rolePrograms, [selectedRole]: updated });
    setNotice(`'${selectedRole}' 권한의 프로그램 구성이 갱신되었습니다.`);
  };

  const handleAddUserToRole = () => {
    if (!newAssignUserEmail.trim()) return;
    const emailOnly = newAssignUserEmail.split(' ')[0];
    const currentList = roleUsers[selectedRole] || [];
    if (currentList.includes(emailOnly)) {
      setNotice(`⚠️ '${emailOnly}' 사용자는 이미 '${selectedRole}' 권한에 등록되어 있습니다.`);
      return;
    }
    setRoleUsers({
      ...roleUsers,
      [selectedRole]: [...currentList, emailOnly],
    });
    setNotice(`✅ '${emailOnly}' 사용자가 '${selectedRole}' 권한에 성공적으로 추가되었습니다.`);
    setNewAssignUserEmail('');
  };

  return (
    <div className="space-y-4 text-xs">
      {notice && (
        <div className="p-3 bg-indigo-950 border border-indigo-500/40 rounded-xl text-indigo-200 flex justify-between items-center">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 3대 서브탭 전환 (요청 4 반영: 괄호명 삭제 및 모바일 겹치기/세그먼트 탭 지원) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveSubTab('ROLES')}
          className={`px-3 py-2 rounded-lg font-semibold text-center text-xs transition-all ${
            activeSubTab === 'ROLES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          권한관리
        </button>
        <button
          onClick={() => setActiveSubTab('PROG_ROLES')}
          className={`px-3 py-2 rounded-lg font-semibold text-center text-xs transition-all ${
            activeSubTab === 'PROG_ROLES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          프로그램권한관리
        </button>
        <button
          onClick={() => setActiveSubTab('USER_ROLES')}
          className={`px-3 py-2 rounded-lg font-semibold text-center text-xs transition-all ${
            activeSubTab === 'USER_ROLES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          사용자권한관리
        </button>
      </div>

      {/* 탭 1: 권한관리 (등록, 수정, 삭제 - 요청 6 반영: 가로넓이 overflow 방지 및 모바일 카드 뷰) */}
      {activeSubTab === 'ROLES' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-white text-xs">신규 역할 권한 등록</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="권한 코드 (예: ROLE_AUDITOR)"
                value={newRoleId}
                onChange={(e) => setNewRoleId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
              />
              <input
                type="text"
                placeholder="권한 명칭 (예: 내부감사관)"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
              />
              <button
                onClick={() => {
                  if (newRoleId && newRoleName) {
                    setRoleGroups([
                      ...roleGroups,
                      { id: newRoleId, name: newRoleName, priority: roleGroups.length + 1, desc: '신규 정의 권한 그룹' },
                    ]);
                    setNewRoleId('');
                    setNewRoleName('');
                    setNotice('신규 권한이 성공적으로 등록되었습니다.');
                  }
                }}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs shadow"
              >
                + 권한 등록
              </button>
            </div>
          </div>

          {/* 데스크톱 테이블 */}
          <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">권한 ID</th>
                  <th className="p-3">권한 명칭</th>
                  <th className="p-3">우선순위</th>
                  <th className="p-3">설명</th>
                  <th className="p-3 text-center">조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {roleGroups.map((rg) => (
                  <tr key={rg.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-mono font-bold text-indigo-300">{rg.id}</td>
                    <td className="p-3 font-medium text-slate-200">{rg.name}</td>
                    <td className="p-3 font-mono text-emerald-400">우선순위 {rg.priority}</td>
                    <td className="p-3 text-slate-400">{rg.desc}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setRoleGroups(roleGroups.filter((r) => r.id !== rg.id));
                          setNotice(`권한 '${rg.id}'가 삭제되었습니다.`);
                        }}
                        className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-xs"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 뷰 (요청 5 반영) */}
          <div className="block md:hidden space-y-2">
            {roleGroups.map((rg) => (
              <div key={rg.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-indigo-300 text-xs">{rg.id}</span>
                  <span className="font-mono text-emerald-400 text-[11px]">우선순위 {rg.priority}</span>
                </div>
                <div className="font-medium text-slate-200">{rg.name}</div>
                <div className="text-[11px] text-slate-400">{rg.desc}</div>
                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      setRoleGroups(roleGroups.filter((r) => r.id !== rg.id));
                      setNotice(`권한 '${rg.id}'가 삭제되었습니다.`);
                    }}
                    className="px-2.5 py-1 bg-rose-950 text-rose-300 rounded text-xs"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 탭 2: 프로그램권한관리 (권한에 프로그램 등록 - 모바일 카드 뷰 지원) */}
      {activeSubTab === 'PROG_ROLES' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">설정할 권한:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs"
              >
                {roleGroups.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                ))}
              </select>
            </div>
            <span className="text-slate-500 text-[11px]">선택된 프로그램: {(rolePrograms[selectedRole] || []).length}개</span>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <span className="font-semibold text-emerald-400 block">
              ['{selectedRole}'] 권한에 허용할 화면 프로그램을 체크박스로 지정하세요:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allAvailablePrograms.map((prog) => {
                const checked = (rolePrograms[selectedRole] || []).includes(prog.id);
                return (
                  <label
                    key={prog.id}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                      checked ? 'bg-indigo-950/40 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-200 text-xs">{prog.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{prog.id}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProgramInRole(prog.id)}
                      className="accent-indigo-500 w-4 h-4"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 탭 3: 사용자권한관리 (권한에 사용자 등록 - 요청 7 사용자 추가 기능 완비 & 모바일 카드 뷰) */}
      {activeSubTab === 'USER_ROLES' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">대상 권한:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-xs"
              >
                {roleGroups.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                ))}
              </select>
            </div>
            <span className="text-slate-500 text-[11px]">배정된 사용자: {(roleUsers[selectedRole] || []).length}명</span>
          </div>

          {/* 신규 사용자 추가 폼 (요청 7 반영) */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-white text-xs">➕ ['{selectedRole}'] 권한에 신규 사용자 배정 (사용자 추가)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={newAssignUserEmail}
                onChange={(e) => setNewAssignUserEmail(e.target.value)}
                className="w-full sm:col-span-2 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono"
              >
                <option value="">-- 배정할 사용자 선택 --</option>
                {candidateUsers.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button
                onClick={handleAddUserToRole}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs shadow"
              >
                + 사용자 권한 부여
              </button>
            </div>
          </div>

          {/* 현재 배정 사용자 목록 */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <span className="font-semibold text-emerald-400 block">
              현재 ['{selectedRole}'] 권한이 부여된 사용자 목록:
            </span>
            <div className="space-y-1.5">
              {(roleUsers[selectedRole] || []).length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">배정된 사용자가 없습니다.</div>
              ) : (
                (roleUsers[selectedRole] || []).map((email, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs">
                    <span className="text-slate-200">{email}</span>
                    <button
                      onClick={() => {
                        const updated = (roleUsers[selectedRole] || []).filter((e) => e !== email);
                        setRoleUsers({ ...roleUsers, [selectedRole]: updated });
                        setNotice(`'${email}' 사용자의 권한이 성공적으로 해제되었습니다.`);
                      }}
                      className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded font-sans text-xs"
                    >
                      권한 해제
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// PG-ADM-06: 메뉴관리 (요청 8 반영: 등록영역 가로넓이 overflow 수정 & 모바일 카드 뷰 완비)
export function AdminMenusView() {
  const [menus, setMenus] = useState([
    { id: 'MENU-01', title: '홈 대시보드', order: 1, route: '/home', progId: 'PG-USR-03', visible: true },
    { id: 'MENU-02', title: '문서 라이브러리', order: 2, route: '/documents', progId: 'PG-USR-05', visible: true },
    { id: 'MENU-03', title: '가상 PDF 뷰어', order: 3, route: '/viewer', progId: 'PG-USR-06', visible: true },
    { id: 'MENU-04', title: '오프라인 동기화', order: 4, route: '/offline', progId: 'PG-USR-08', visible: true },
    { id: 'MENU-05', title: '시스템 설정', order: 5, route: '/settings', progId: 'PG-USR-09', visible: true },
  ]);

  const [newMenuTitle, setNewMenuTitle] = useState('');
  const [newMenuProg, setNewMenuProg] = useState('PG-USR-01');

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= menus.length) return;
    const copy = [...menus];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    copy.forEach((m, idx) => (m.order = idx + 1));
    setMenus(copy);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 메뉴 등록 바 (요청 8 반영: responsive grid로 가로 튐 완전 해결) */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
        <span className="font-bold text-white text-xs">➕ 신규 포털 메뉴 등록 & 화면 매핑</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="메뉴 명칭 (예: 고객지원센터)"
            value={newMenuTitle}
            onChange={(e) => setNewMenuTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
          />
          <select
            value={newMenuProg}
            onChange={(e) => setNewMenuProg(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs"
          >
            <option value="PG-USR-01">첫화면 (PG-USR-01)</option>
            <option value="PG-USR-03">홈 대시보드 (PG-USR-03)</option>
            <option value="PG-USR-06">문서뷰어 (PG-USR-06)</option>
            <option value="PG-ADM-13">고객지원 (PG-ADM-13)</option>
            <option value="PG-ADM-12">공지사항 (PG-ADM-12)</option>
          </select>
          <button
            onClick={() => {
              if (newMenuTitle) {
                setMenus([
                  ...menus,
                  {
                    id: `MENU-0${menus.length + 1}`,
                    title: newMenuTitle,
                    order: menus.length + 1,
                    route: `/${newMenuTitle}`,
                    progId: newMenuProg,
                    visible: true,
                  },
                ]);
                setNewMenuTitle('');
              }
            }}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs shadow"
          >
            + 메뉴 등록
          </button>
        </div>
      </div>

      {/* 데스크톱 테이블 */}
      <div className="hidden md:block bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">순서</th>
              <th className="p-3">메뉴 명칭</th>
              <th className="p-3">매핑된 화면 프로그램</th>
              <th className="p-3">라우트 경로</th>
              <th className="p-3">사용 여부</th>
              <th className="p-3 text-center">위치 이동 / 삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {menus.map((m, idx) => (
              <tr key={m.id} className="hover:bg-slate-900/40">
                <td className="p-3 font-mono font-bold text-emerald-400">{m.order}</td>
                <td className="p-3 font-bold text-slate-200">{m.title}</td>
                <td className="p-3 font-mono text-indigo-300">{m.progId}</td>
                <td className="p-3 font-mono text-slate-500">{m.route}</td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={m.visible}
                    onChange={(e) => setMenus(menus.map((x) => (x.id === m.id ? { ...x, visible: e.target.checked } : x)))}
                    className="accent-indigo-500 w-4 h-4"
                  />
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => moveOrder(idx, 'up')} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">▲</button>
                    <button onClick={() => moveOrder(idx, 'down')} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">▼</button>
                    <button onClick={() => setMenus(menus.filter((x) => x.id !== m.id))} className="px-2 py-0.5 bg-rose-950 text-rose-300 rounded ml-2 hover:bg-rose-900">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 (요청 8 반영: 0px 가로스크롤 보장) */}
      <div className="block md:hidden space-y-2">
        {menus.map((m, idx) => (
          <div key={m.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-emerald-400 font-bold">순번 #{m.order}</span>
              <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                <span>사용:</span>
                <input
                  type="checkbox"
                  checked={m.visible}
                  onChange={(e) => setMenus(menus.map((x) => (x.id === m.id ? { ...x, visible: e.target.checked } : x)))}
                  className="accent-indigo-500"
                />
              </label>
            </div>
            <div className="font-bold text-slate-200 text-sm">{m.title}</div>
            <div className="text-[11px] font-mono text-slate-400">
              연결 화면: <strong className="text-indigo-300">{m.progId}</strong> ({m.route})
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-900">
              <button onClick={() => moveOrder(idx, 'up')} className="flex-1 py-1 bg-slate-800 text-slate-200 rounded text-center">▲ 위로</button>
              <button onClick={() => moveOrder(idx, 'down')} className="flex-1 py-1 bg-slate-800 text-slate-200 rounded text-center">▼ 아래로</button>
              <button onClick={() => setMenus(menus.filter((x) => x.id !== m.id))} className="px-3 py-1 bg-rose-950 text-rose-300 rounded text-center">삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
