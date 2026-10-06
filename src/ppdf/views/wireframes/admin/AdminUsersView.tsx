import { useState } from 'react';

export interface AdminUserItem {
  id: string;
  name: string;
  avatarUrl: string;
  avatarColor: string;
  status: '정상' | '제한' | '휴면';
  offlineAllowed: boolean;
  offlineDaysLeft: number;
  storageType: string;
  storagePath: string;
  storageUsage: string;
  roles: string[]; // 다중 권한 설정 지원 (요청 4 반영)
}

const INITIAL_USERS: AdminUserItem[] = [
  {
    id: 'user_0921@corp.com',
    name: '홍길동',
    avatarUrl: '',
    avatarColor: 'from-indigo-500 to-purple-600',
    status: '정상',
    offlineAllowed: true,
    offlineDaysLeft: 29,
    storageType: 'Synology NAS',
    storagePath: '/volume1/pdf_docs',
    storageUsage: '45.2 GB / 100 GB',
    roles: ['ROLE_EDITOR', 'ROLE_USER'],
  },
  {
    id: 'guest_8812@gmail.com',
    name: '김영희',
    avatarUrl: '',
    avatarColor: 'from-amber-500 to-rose-600',
    status: '제한',
    offlineAllowed: false,
    offlineDaysLeft: 0,
    storageType: 'Google Drive',
    storagePath: 'My Drive/purepdf',
    storageUsage: '12.8 GB / 30 GB',
    roles: ['ROLE_USER'],
  },
  {
    id: 'dev_lead@purepdf.kr',
    name: '이수진',
    avatarUrl: '',
    avatarColor: 'from-emerald-500 to-teal-600',
    status: '정상',
    offlineAllowed: true,
    offlineDaysLeft: 14,
    storageType: 'QNAP NAS (SFTP)',
    storagePath: '/share/research',
    storageUsage: '88.1 GB / 200 GB',
    roles: ['ROLE_ADMIN', 'ROLE_EDITOR'],
  },
  {
    id: 'dormant_user@daum.net',
    name: '박철수',
    avatarUrl: '',
    avatarColor: 'from-slate-500 to-slate-700',
    status: '휴면',
    offlineAllowed: false,
    offlineDaysLeft: 0,
    storageType: 'Local WebDAV',
    storagePath: '/webdav/personal',
    storageUsage: '2.1 GB / 10 GB',
    roles: ['ROLE_USER'],
  },
];

const AVAILABLE_ROLES = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EDITOR', 'ROLE_USER'];

export function AdminUsersView() {
  const [users, setUsers] = useState<AdminUserItem[]>(INITIAL_USERS);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [searchName, setSearchName] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  const toggleUserRole = (userId: string, role: string) => {
    setUsers(
      users.map((u) => {
        if (u.id !== userId) return u;
        const has = u.roles.includes(role);
        const updatedRoles = has ? u.roles.filter((r) => r !== role) : [...u.roles, role];
        return { ...u, roles: updatedRoles };
      })
    );
    if (selectedUser && selectedUser.id === userId) {
      const has = selectedUser.roles.includes(role);
      const updatedRoles = has ? selectedUser.roles.filter((r) => r !== role) : [...selectedUser.roles, role];
      setSelectedUser({ ...selectedUser, roles: updatedRoles });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesNameOrId =
      !searchName.trim() ||
      u.name.toLowerCase().includes(searchName.toLowerCase()) ||
      u.id.toLowerCase().includes(searchName.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
    const matchesRole = filterRole === 'ALL' || u.roles.includes(filterRole);
    return matchesNameOrId && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-4 text-xs">
      {notice && (
        <div className="p-3 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-indigo-200 flex justify-between items-center">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[11px] text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 개인정보 불변원칙 헌장 */}
      <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl text-rose-300 flex items-center justify-between">
        <span>🛡️ <strong>개인정보 불변원칙</strong>: 관리자는 회원의 비밀번호 평문이나 식별정보를 임의 수정할 수 없으며 초기화 링크 발송만 가능합니다.</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20">보안 1등급</span>
      </div>

      {/* 검색 및 필터 바 (이름/권한/상태 검색조건 추가 - 요청 2 반영) */}
      <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="회원명 또는 이메일 검색..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs w-full sm:w-48"
          />

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
          >
            <option value="ALL">전체 권한</option>
            {AVAILABLE_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <div className="flex gap-1 items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] px-1.5">상태:</span>
            {['ALL', '정상', '제한', '휴면'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all ${
                  filterStatus === st ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? '전체' : st}
              </button>
            ))}
          </div>
        </div>

        <span className="text-slate-400 text-[11px] self-end md:self-auto">
          조회 결과: <strong className="text-indigo-400">{filteredUsers.length}</strong> / {users.length}명
        </span>
      </div>

      {/* 사용자 목록 테이블 (프로필 사진 포함 - 요청 4) */}
      <div className="hidden md:block overflow-x-auto bg-slate-950/70 border border-slate-800 rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">프로필 / 사용자 ID</th>
              <th className="p-3">회원명</th>
              <th className="p-3">상태</th>
              <th className="p-3">오프라인 사용</th>
              <th className="p-3">연동 스토리지</th>
              <th className="p-3">부여된 다중 권한</th>
              <th className="p-3 text-center">상세조회 / 관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {/* 프로필 사진 아바타 뱃지 */}
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${u.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow shrink-0`}>
                        {u.name.slice(0, 1)}
                      </div>
                      <div className="font-mono text-slate-200 font-medium">{u.id}</div>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-slate-300">{u.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${u.status === '정상' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    {u.offlineAllowed ? <span className="text-emerald-400 font-semibold">허용 ({u.offlineDaysLeft}일)</span> : <span className="text-slate-500">비활성</span>}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-400">
                    <div>{u.storageType}</div>
                    <div className="text-[10px] text-indigo-400">{u.storageUsage}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium"
                    >
                      상세조회
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 전용 카드 뷰 */}
      <div className="block md:hidden space-y-2.5">
        {filteredUsers.map((u) => (
            <div key={u.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${u.avatarColor} flex items-center justify-center font-bold text-white text-xs shrink-0`}>
                    {u.name.slice(0, 1)}
                  </div>
                  <span className="font-semibold text-slate-200">{u.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] ${u.status === '정상' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {u.status}
                </span>
              </div>
              <div className="font-mono text-slate-400 text-[11px] break-all">{u.id}</div>
              <div className="flex flex-wrap gap-1">
                {u.roles.map((r) => (
                  <span key={r} className="px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono">{r}</span>
                ))}
              </div>
              <button
                onClick={() => setSelectedUser(u)}
                className="w-full py-1.5 bg-slate-800 text-slate-200 rounded font-medium text-center"
              >
                상세화면 조회 및 권한 설정
              </button>
            </div>
          ))}
      </div>

      {/* 사용자 상세화면 조회 팝업 모달 (요청 3 반영: fixed 모달 오버레이 전환) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/60 rounded-2xl p-4 sm:p-5 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedUser.avatarColor} flex items-center justify-center font-bold text-white text-base shadow`}>
                  {selectedUser.name.slice(0, 1)}
                </div>
                <div>
                  <span className="font-bold text-white text-sm">{selectedUser.name} ({selectedUser.id})</span>
                  <span className="block text-[11px] text-slate-400">회원 상세정보 및 다중 권한 관리</span>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white text-base px-2">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-indigo-300">👤 기본 정보 & 상태</span>
                <div className="space-y-1 text-slate-300">
                  <div>계정 식별자: <span className="font-mono text-slate-200">{selectedUser.id}</span></div>
                  <div>회원 상태: <span className="font-semibold text-emerald-400">{selectedUser.status}</span></div>
                  <div>오프라인 토큰: <span className="font-mono">{selectedUser.offlineAllowed ? `${selectedUser.offlineDaysLeft}일 유효` : '비활성'}</span></div>
                </div>
                <button
                  onClick={() => setNotice(`📧 [발송완료] '${selectedUser.id}'에게 비밀번호 재설정 일회용 링크가 발송되었습니다.`)}
                  className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-xs"
                >
                  비밀번호 초기화 메일 발송
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-indigo-300">🗄️ 연동 스토리지 현황</span>
                <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <div>종류: {selectedUser.storageType}</div>
                  <div>경로: {selectedUser.storagePath}</div>
                  <div>용량: {selectedUser.storageUsage}</div>
                </div>
              </div>
            </div>

            {/* 다중 권한 설정 체크박스 */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-indigo-300">🔑 다중 역할 권한 부여 (Multiple Roles Assignment)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {AVAILABLE_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUser.roles.includes(role)}
                      onChange={() => toggleUserRole(selectedUser.id, role)}
                      className="accent-indigo-500"
                    />
                    <span className={selectedUser.roles.includes(role) ? 'text-indigo-300 font-mono font-bold' : 'text-slate-400 font-mono'}>{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setSelectedUser(null)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
