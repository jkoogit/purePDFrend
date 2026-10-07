import React, { useState } from 'react';
import { Button, Input, Badge, Card, Modal } from '@shared/components/ui';

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
  roles: string[]; // 다중 권한 설정 지원
}

const INITIAL_USERS: AdminUserItem[] = [
  {
    id: 'user_0921@corp.com',
    name: '홍길동',
    avatarUrl: '',
    avatarColor: 'from-blue-500 to-indigo-600',
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
        <div className="p-3 bg-blue-950/80 border border-blue-500/40 rounded-xl text-blue-200 flex justify-between items-center animate-fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[11px] text-blue-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* 개인정보 불변원칙 헌장 */}
      <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl text-rose-300 flex items-center justify-between">
        <span>🛡️ <strong>개인정보 불변원칙</strong>: 관리자는 회원의 비밀번호 평문이나 식별정보를 임의 수정할 수 없으며 초기화 링크 발송만 가능합니다.</span>
        <Badge variant="danger" size="sm">보안 1등급</Badge>
      </div>

      {/* 검색 및 필터 바 */}
      <Card variant="subtle">
        <div className="p-3 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-48">
              <Input
                type="text"
                placeholder="회원명 또는 이메일 검색..."
                value={searchName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)}
                touchTarget={false}
              />
            </div>

            <select
              value={filterRole}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterRole(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    filterStatus === st ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? '전체' : st}
                </button>
              ))}
            </div>
          </div>

          <span className="text-slate-400 text-[11px] self-end md:self-auto font-mono">
            조회 결과: <strong className="text-blue-400">{filteredUsers.length}</strong> / {users.length}명
          </span>
        </div>
      </Card>

      {/* 사용자 목록 테이블 */}
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
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${u.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow shrink-0 select-none`}>
                      {u.name.slice(0, 1)}
                    </div>
                    <div className="font-mono text-slate-200 font-medium">{u.id}</div>
                  </div>
                </td>
                <td className="p-3 font-medium text-slate-300">{u.name}</td>
                <td className="p-3">
                  <Badge
                    variant={u.status === '정상' ? 'success' : u.status === '제한' ? 'danger' : 'warning'}
                    size="sm"
                    dot
                  >
                    {u.status}
                  </Badge>
                </td>
                <td className="p-3 font-mono text-[11px]">
                  {u.offlineAllowed ? (
                    <Badge variant="success" size="sm">허용 ({u.offlineDaysLeft}일)</Badge>
                  ) : (
                    <span className="text-slate-500">비활성</span>
                  )}
                </td>
                <td className="p-3 font-mono text-[11px] text-slate-400">
                  <div>{u.storageType}</div>
                  <div className="text-[10px] text-blue-400">{u.storageUsage}</div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="neutral" size="sm">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedUser(u)}
                  >
                    상세조회
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 전용 카드 뷰 */}
      <div className="block md:hidden space-y-2.5">
        {filteredUsers.map((u) => (
          <Card key={u.id} variant="subtle" className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${u.avatarColor} flex items-center justify-center font-bold text-white text-xs shrink-0 select-none`}>
                  {u.name.slice(0, 1)}
                </div>
                <span className="font-semibold text-slate-200">{u.name}</span>
              </div>
              <Badge
                variant={u.status === '정상' ? 'success' : u.status === '제한' ? 'danger' : 'warning'}
                size="sm"
                dot
              >
                {u.status}
              </Badge>
            </div>
            <div className="font-mono text-slate-400 text-[11px] break-all">{u.id}</div>
            <div className="flex flex-wrap gap-1">
              {u.roles.map((r) => (
                <Badge key={r} variant="neutral" size="sm">
                  {r}
                </Badge>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedUser(u)}
              className="w-full"
            >
              상세화면 조회 및 권한 설정
            </Button>
          </Card>
        ))}
      </div>

      {/* 사용자 상세화면 조회 Modal */}
      {selectedUser && (
        <Modal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          size="lg"
          title={
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${selectedUser.avatarColor} flex items-center justify-center font-bold text-white text-sm shadow select-none`}>
                {selectedUser.name.slice(0, 1)}
              </div>
              <div>
                <span className="font-bold text-white text-sm sm:text-base">{selectedUser.name}</span>
                <span className="block font-mono text-xs text-slate-400">{selectedUser.id}</span>
              </div>
            </div>
          }
          description="회원 상세정보 및 다중 권한 관리"
          footer={
            <Button variant="primary" size="sm" onClick={() => setSelectedUser(null)}>
              확인 및 닫기
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card variant="subtle" className="p-3 space-y-2">
              <h4 className="font-semibold text-blue-300">👤 기본 정보 & 상태</h4>
              <div className="space-y-1.5 text-slate-300 text-xs">
                <div>계정 식별자: <span className="font-mono text-slate-200">{selectedUser.id}</span></div>
                <div className="flex items-center gap-2">
                  <span>회원 상태:</span>
                  <Badge variant={selectedUser.status === '정상' ? 'success' : 'danger'} size="sm">
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>오프라인 토큰: <span className="font-mono text-slate-200">{selectedUser.offlineAllowed ? `${selectedUser.offlineDaysLeft}일 유효` : '비활성'}</span></div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotice(`📧 [발송완료] '${selectedUser.id}'에게 비밀번호 재설정 일회용 링크가 발송되었습니다.`)}
                className="mt-2 w-full text-blue-300 border-blue-800/60"
              >
                비밀번호 초기화 메일 발송
              </Button>
            </Card>

            <Card variant="subtle" className="p-3 space-y-2">
              <h4 className="font-semibold text-blue-300">🗄️ 연동 스토리지 현황</h4>
              <div className="space-y-1.5 text-slate-300 font-mono text-[11px]">
                <div>종류: <span className="text-slate-100">{selectedUser.storageType}</span></div>
                <div>경로: <span className="text-slate-100">{selectedUser.storagePath}</span></div>
                <div>용량: <span className="text-blue-400 font-bold">{selectedUser.storageUsage}</span></div>
              </div>
            </Card>
          </div>

          {/* 다중 권한 설정 체크박스 */}
          <Card variant="subtle" className="p-3 space-y-2">
            <h4 className="font-semibold text-blue-300">🔑 다중 역할 권한 부여 (Multiple Roles)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {AVAILABLE_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedUser.roles.includes(role)}
                    onChange={() => toggleUserRole(selectedUser.id, role)}
                    className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className={selectedUser.roles.includes(role) ? 'text-blue-300 font-mono font-bold' : 'text-slate-400 font-mono'}>{role}</span>
                </label>
              ))}
            </div>
          </Card>
        </Modal>
      )}
    </div>
  );
}

