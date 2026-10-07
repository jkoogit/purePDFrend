import React, { useState } from 'react';
import { Button, Input, Badge, Card, Modal } from '@shared/components/ui';

export interface ScreenProgramItem {
  id: string;
  name: string;
  parentId: string;
  route: string;
  roles: string[]; // 다중 권한 설정 지원 (요청 3 반영)
  status: 'ACTIVE' | 'INACTIVE';
  version: string;
}

const INITIAL_PROGRAMS: ScreenProgramItem[] = [
  { id: 'PG-USR-ROOT', name: '사용자 포털 루트', parentId: 'ROOT', route: '/usr', roles: ['ROLE_USER', 'ROLE_ADMIN'], status: 'ACTIVE', version: 'v2.0' },
  { id: 'PG-USR-01', name: '첫화면 (랜딩)', parentId: 'PG-USR-ROOT', route: '/', roles: ['ROLE_USER', 'ROLE_GUEST'], status: 'ACTIVE', version: 'v2.1' },
  { id: 'PG-USR-02', name: '로그인/회원가입', parentId: 'PG-USR-ROOT', route: '/auth', roles: ['ROLE_USER', 'ROLE_GUEST'], status: 'ACTIVE', version: 'v2.0' },
  { id: 'PG-USR-03', name: '홈화면 (대시보드)', parentId: 'PG-USR-ROOT', route: '/home', roles: ['ROLE_USER', 'ROLE_EDITOR'], status: 'ACTIVE', version: 'v2.3' },
  { id: 'PG-USR-06', name: '문서뷰어 & 주석스튜디오', parentId: 'PG-USR-ROOT', route: '/viewer', roles: ['ROLE_USER', 'ROLE_EDITOR', 'ROLE_ADMIN'], status: 'ACTIVE', version: 'v3.0' },
  { id: 'PG-ADM-ROOT', name: '관리자 포털 루트', parentId: 'ROOT', route: '/admin', roles: ['ROLE_ADMIN'], status: 'ACTIVE', version: 'v2.0' },
  { id: 'PG-ADM-01', name: '보안관리', parentId: 'PG-ADM-ROOT', route: '/admin/security', roles: ['ROLE_ADMIN'], status: 'ACTIVE', version: 'v2.5' },
  { id: 'PG-ADM-02', name: '프로그램관리', parentId: 'PG-ADM-ROOT', route: '/admin/programs', roles: ['ROLE_ADMIN'], status: 'ACTIVE', version: 'v2.2' },
  { id: 'PG-ADM-03', name: '사용자관리', parentId: 'PG-ADM-ROOT', route: '/admin/users', roles: ['ROLE_ADMIN'], status: 'ACTIVE', version: 'v2.4' },
  { id: 'PG-ADM-04', name: '약관·동의·정책', parentId: 'PG-ADM-ROOT', route: '/admin/terms', roles: ['ROLE_ADMIN'], status: 'ACTIVE', version: 'v2.4' },
  { id: 'PG-ADM-05', name: '사용자 권한관리', parentId: 'PG-ADM-ROOT', route: '/admin/roles', roles: ['ROLE_ADMIN'], status: 'ACTIVE', version: 'v2.0' },
  { id: 'PG-ADM-06', name: '메뉴관리', parentId: 'PG-ADM-ROOT', route: '/admin/menus', roles: ['ROLE_ADMIN'], status: 'ACTIVE', version: 'v2.0' },
];

const AVAILABLE_ROLES = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EDITOR', 'ROLE_USER', 'ROLE_GUEST'];

export function AdminProgramsView() {
  const [programs, setPrograms] = useState<ScreenProgramItem[]>(INITIAL_PROGRAMS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Search & Filter State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [domainFilter, setDomainFilter] = useState<'ALL' | 'USR' | 'ADM'>('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formParent, setFormParent] = useState('PG-ADM-ROOT');
  const [formRoute, setFormRoute] = useState('');
  const [formRoles, setFormRoles] = useState<string[]>(['ROLE_ADMIN']);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const openCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormId(`PG-ADM-${String(programs.length + 1).padStart(2, '0')}`);
    setFormName('');
    setFormParent('PG-ADM-ROOT');
    setFormRoute('/admin/new');
    setFormRoles(['ROLE_ADMIN']);
    setFormStatus('ACTIVE');
  };

  const openEdit = (item: ScreenProgramItem) => {
    setEditingId(item.id);
    setIsCreating(false);
    setFormId(item.id);
    setFormName(item.name);
    setFormParent(item.parentId);
    setFormRoute(item.route);
    setFormRoles(item.roles);
    setFormStatus(item.status);
  };

  const [dagError, setDagError] = useState<string | null>(null);

  // DAG 순환참조 방지 알고리즘 (Cycle Detection Engine)
  const isDagCycle = (targetId: string, testParentId: string): boolean => {
    if (!testParentId || testParentId === 'ROOT') return false;
    if (targetId === testParentId) return true;
    let currentId: string | null = testParentId;
    const visited = new Set<string>();
    while (currentId && currentId !== 'ROOT') {
      if (visited.has(currentId)) break;
      visited.add(currentId);
      if (currentId === targetId) return true;
      const parentNode = programs.find((p) => p.id === currentId);
      currentId = parentNode ? parentNode.parentId : null;
    }
    return false;
  };

  const toggleRole = (r: string) => {
    if (formRoles.includes(r)) {
      setFormRoles(formRoles.filter((x) => x !== r));
    } else {
      setFormRoles([...formRoles, r]);
    }
  };

  const handleSave = () => {
    if (!formId.trim() || !formName.trim()) return;
    if (isDagCycle(formId, formParent)) {
      setDagError(`🚨 [DAG 순환참조 감지] '${formId}'의 부모로 '${formParent}'를 지정하면 순환 루프가 발생하여 저장이 차단됩니다!`);
      return;
    }
    setDagError(null);
    if (isCreating) {
      setPrograms([
        ...programs,
        { id: formId, name: formName, parentId: formParent, route: formRoute, roles: formRoles, status: formStatus, version: 'v1.0' },
      ]);
    } else if (editingId) {
      setPrograms(
        programs.map((p) =>
          p.id === editingId
            ? { ...p, name: formName, parentId: formParent, route: formRoute, roles: formRoles, status: formStatus }
            : p
        )
      );
    }
    setIsCreating(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`프로그램 [${id}]을(를) 삭제하시겠습니까?`)) {
      setPrograms(programs.filter((p) => p.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const filteredPrograms = programs.filter((p) => {
    const matchesKeyword =
      !searchKeyword.trim() ||
      p.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.route.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesDomain =
      domainFilter === 'ALL' ||
      (domainFilter === 'USR' && p.id.startsWith('PG-USR')) ||
      (domainFilter === 'ADM' && p.id.startsWith('PG-ADM'));

    const matchesRole = roleFilter === 'ALL' || p.roles.includes(roleFilter);
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesKeyword && matchesDomain && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4 text-xs">
      {/* 헤더 & 등록 버튼 */}
      <Card variant="subtle">
        <div className="p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <span>🖥️</span> 프로그램 및 화면 관리
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">화면 프로그램 등록, 수정, 삭제 및 역할별 다중 접근 권한을 매핑합니다.</p>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate} className="self-start sm:self-auto">
            + 프로그램 등록
          </Button>
        </div>
      </Card>

      {/* 검색 및 필터 조건 바 */}
      <Card variant="subtle">
        <div className="p-3 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <Input
                type="text"
                placeholder="프로그램 ID, 명칭, 라우트..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                touchTarget={false}
              />
            </div>
            <select
              value={domainFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDomainFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">전체 도메인</option>
              <option value="USR">사용자 포털 (PG-USR)</option>
              <option value="ADM">관리자 포털 (PG-ADM)</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">전체 권한</option>
              {AVAILABLE_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">전체 상태</option>
              <option value="ACTIVE">활성 (ACTIVE)</option>
              <option value="INACTIVE">비활성 (INACTIVE)</option>
            </select>
          </div>
          <span className="text-slate-400 text-[11px] whitespace-nowrap self-end sm:self-center font-mono">
            검색 결과: <strong className="text-blue-400">{filteredPrograms.length}</strong> / {programs.length}건
          </span>
        </div>
      </Card>

      {/* 등록 및 수정 폼 (표준 Modal 컴포넌트 적용) */}
      <Modal
        isOpen={isCreating || Boolean(editingId)}
        onClose={() => { setIsCreating(false); setEditingId(null); }}
        title={isCreating ? '➕ 신규 프로그램 등록' : `✏️ 프로그램 수정: [${editingId}]`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setIsCreating(false); setEditingId(null); }}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              저장 완료
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="프로그램 ID"
              disabled={!isCreating}
              value={formId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormId(e.target.value)}
              placeholder="예: PG-ADM-17"
              className="font-mono"
            />
          </div>
          <div>
            <Input
              label="화면 프로그램 명칭"
              value={formName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
              placeholder="예: 대시보드 리포트"
            />
          </div>
          <div>
            <label className="text-slate-300 block mb-1.5 font-medium">부모 프로그램 (DAG 계층 트리)</label>
            <select
              value={formParent}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormParent(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="ROOT">ROOT (최상위 루트)</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.id} ({p.name})</option>
              ))}
            </select>
          </div>
          <div>
            <Input
              label="라우트 경로 (Path)"
              value={formRoute}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRoute(e.target.value)}
              placeholder="/admin/report"
              className="font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-300 block mb-1.5 font-medium">접근 가능 권한 설정 (다중 권한 지원)</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_ROLES.map((r) => (
                <label key={r} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer text-[11px] hover:border-slate-700">
                  <input type="checkbox" checked={formRoles.includes(r)} onChange={() => toggleRole(r)} className="accent-blue-500 w-3.5 h-3.5 cursor-pointer" />
                  <span className={formRoles.includes(r) ? 'text-blue-300 font-medium font-mono' : 'text-slate-400 font-mono'}>{r}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {dagError && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-300 font-semibold text-xs">
            {dagError}
          </div>
        )}
      </Modal>

      {/* 프로그램 목록 테이블 (데스크톱 & 모바일 카드) */}
      <div className="hidden md:block overflow-x-auto bg-slate-950/70 border border-slate-800 rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-3">프로그램 ID</th>
              <th className="p-3">프로그램 명칭</th>
              <th className="p-3">부모 ID</th>
              <th className="p-3">라우트 경로</th>
              <th className="p-3">부여된 다중 권한</th>
              <th className="p-3">상태</th>
              <th className="p-3 text-center">관리 조치</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredPrograms.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900/40">
                <td className="p-3 font-mono font-bold text-blue-300">{p.id}</td>
                <td className="p-3 font-medium text-slate-200">{p.name}</td>
                <td className="p-3 font-mono text-slate-400">{p.parentId}</td>
                <td className="p-3 font-mono text-slate-500">{p.route}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {p.roles.map((r) => (
                      <Badge key={r} variant="neutral" size="sm">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm" dot>
                    {p.status}
                  </Badge>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>
                      수정
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>
                      삭제
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 반응형 카드 (0px 가로스크롤) */}
      <div className="block md:hidden space-y-2.5">
        {filteredPrograms.map((p) => (
          <Card key={p.id} variant="subtle" className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-blue-300">{p.id}</span>
              <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm" dot>
                {p.status}
              </Badge>
            </div>
            <div className="font-medium text-slate-200 text-sm">{p.name}</div>
            <div className="text-[11px] text-slate-400 font-mono">부모: {p.parentId} | 경로: {p.route}</div>
            <div className="flex flex-wrap gap-1">
              {p.roles.map((r) => (
                <Badge key={r} variant="neutral" size="sm">
                  {r}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-900">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                수정
              </Button>
              <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDelete(p.id)}>
                삭제
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

