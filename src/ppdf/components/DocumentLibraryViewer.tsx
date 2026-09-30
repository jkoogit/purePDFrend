import React, { useState, useMemo, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  Search,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Upload,
  Image as ImageIcon,
  Check,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Users,
  EyeOff,
  SlidersHorizontal,
  Download,
  X,
  FileUp,
  Sparkles,
  Archive,
  Sliders,
  Link2,
  Link2Off,
  ArrowLeft,
  ArrowRight,
  FolderTree,
  Route,
  ChevronsLeft,
  ChevronsRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { ImageEditLayerModal, ImageCropSettings, ImageStandardizeSettings } from './ImageEditLayerModal';

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  isShared?: boolean;
  sharedOwner?: string;
  isOpen?: boolean;
  order: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn?: string;
  categoryId: string;
  categoryPath: string;
  lastCategory: string;
  totalPages: number;
  readPages: number;
  progressPercent: number;
  lastReadAt: string;
  rawDate: string;
  status: '대기' | 'OCR완료' | '암호화';
  security: '일반' | '대외비' | '극비';
  docType: '등록문서' | '내가 공유한 문서' | '공유받은 문서';
  version: string;
  fileSize: string;
  round: string;
  coverBg: string;
  accentColor: string;
}

interface DocumentLibraryViewerProps {
  userEmail?: string;
  onOpenViewer?: (docId: string) => void;
  isMobileMode?: boolean;
  className?: string;
}

export function DocumentLibraryViewer({
  userEmail = 'jkok2j2m@gmail.com',
  onOpenViewer,
  isMobileMode = false,
  className = '',
}: DocumentLibraryViewerProps) {
  // ==========================================
  // 1. 카테고리 트리 상태 관리
  // ==========================================
  const [categories, setCategories] = useState<CategoryNode[]>([
    // 5Depth 실증 브랜치: 개발/IT (1) -> 프론트엔드 (2) -> React 생태계 (3) -> 상태 관리 (4) -> Zustand & Redux (5)
    { id: 'cat-dev', name: '개발 / IT', parentId: null, isOpen: true, order: 1 },
    { id: 'cat-dev-fe', name: '웹 프론트엔드', parentId: 'cat-dev', isOpen: true, order: 1 },
    { id: 'cat-dev-fe-react', name: 'React 생태계', parentId: 'cat-dev-fe', isOpen: true, order: 1 },
    { id: 'cat-dev-fe-react-state', name: '상태 관리 엔진', parentId: 'cat-dev-fe-react', isOpen: true, order: 1 },
    { id: 'cat-dev-fe-react-state-zustand', name: 'Zustand & Redux 실무', parentId: 'cat-dev-fe-react-state', isOpen: true, order: 1 },

    // 백엔드 브랜치
    { id: 'cat-dev-be', name: '백엔드 / DB (PostgreSQL)', parentId: 'cat-dev', isOpen: true, order: 2 },

    // 교양 / 인문 브랜치
    { id: 'cat-cult', name: '교양 / 인문', parentId: null, isOpen: true, order: 2 },
    { id: 'cat-cult-hist', name: '역사 / 철학', parentId: 'cat-cult', isOpen: false, order: 1 },

    // 기타 대분류
    { id: 'cat-myste', name: '추리 / 소설', parentId: null, isOpen: true, order: 3 },
    { id: 'cat-biz', name: '경영 / 경제', parentId: null, isOpen: false, order: 4 },

    // 공유받은 폴더
    { id: 'share-hong', name: '홍길동 팀장 공유함', parentId: null, isShared: true, sharedOwner: '홍길동 수석', isOpen: true, order: 5 },
    { id: 'share-company', name: '사내 표준문서함', parentId: null, isShared: true, sharedOwner: '전사아키텍처팀', isOpen: false, order: 6 },
  ]);

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedEditNodeId, setSelectedEditNodeId] = useState<string | null>(null);

  // 7. 편집 모드 목록 연동 토글 (기본값: false - 목록 유지)
  const [isSyncSelectionWithList, setIsSyncSelectionWithList] = useState(false);

  // 4. 트리 / 경로 아이콘 뷰 모드
  const [treeViewMode, setTreeViewMode] = useState<'tree' | 'path'>('tree');
  const [hideSharedFolders, setHideSharedFolders] = useState<boolean>(false);

  // [요청 1.3] 도서카테고리 통합 접힘 상태 (모바일: 위로접기 / 데스크톱: 왼쪽으로접기 상호 현행화)
  const [isCategoryCollapsed, setIsCategoryCollapsed] = useState(false);
  const isCollapsedDesktop = !isMobileMode && isCategoryCollapsed;

  // 카테고리 편집 모드
  const [isEditCategoryMode, setIsEditCategoryMode] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeName, setEditingNodeName] = useState('');
  const [isAddingUnderNodeId, setIsAddingUnderNodeId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);

  const showCatNotice = (msg: string) => {
    setCategoryNotice(msg);
    setTimeout(() => setCategoryNotice(null), 3500);
  };

  // ==========================================
  // 2. 문서 데이터 및 검색 필터 상태
  // ==========================================
  const initialDocuments: DocumentItem[] = [
    {
      id: 'doc-01',
      title: 'ISO 32000-2:2020 문서 관리 및 차세대 PDF 2.0 전자서명 표준 규격 가이드북',
      author: '국제표준화기구(ISO)',
      publisher: '한국표준협회',
      isbn: '978-89-1234-567-8',
      categoryId: 'cat-dev-fe-react-state-zustand',
      categoryPath: '개발 / IT > 웹 프론트엔드 > React 생태계 > 상태 관리 엔진 > Zustand & Redux 실무',
      lastCategory: 'Zustand & Redux 실무',
      totalPages: 840,
      readPages: 655,
      progressPercent: 78,
      lastReadAt: '10분 전',
      rawDate: '2026-09-30 15:20',
      status: 'OCR완료',
      security: '일반',
      docType: '등록문서',
      version: 'v2.1',
      fileSize: '42.8 MB',
      round: '2회독 진행중',
      coverBg: 'from-blue-600 to-indigo-800',
      accentColor: 'border-blue-500/40 text-blue-300',
    },
    {
      id: 'doc-02',
      title: 'TDD 및 도메인 주도 설계(DDD) 기반 대용량 가상화 PDF 렌더링 아키텍처 실전 핸드북',
      author: '마틴 파울러, 에릭 에반스',
      publisher: '에이콘출판사',
      isbn: '978-89-9876-123-4',
      categoryId: 'cat-dev-be',
      categoryPath: '개발 / IT > 백엔드 / DB (PostgreSQL)',
      lastCategory: '백엔드 / DB',
      totalPages: 320,
      readPages: 320,
      progressPercent: 100,
      lastReadAt: '3일 전',
      rawDate: '2026-09-27 10:15',
      status: 'OCR완료',
      security: '일반',
      docType: '등록문서',
      version: 'v2.0',
      fileSize: '18.4 MB',
      round: '완독 (3회독)',
      coverBg: 'from-emerald-600 to-teal-800',
      accentColor: 'border-emerald-500/40 text-emerald-300',
    },
    {
      id: 'doc-03',
      title: '엔터프라이즈 멀티 클라우드 스토리지 자원 거버넌스 및 Dual OCR 분산 파이프라인 명세서',
      author: '사내 클라우드아키텍처실',
      publisher: 'purePDFrend 사내기술원',
      isbn: '979-11-8899-001-2',
      categoryId: 'share-company',
      categoryPath: '사내 표준문서함',
      lastCategory: '표준문서함',
      totalPages: 185,
      readPages: 92,
      progressPercent: 50,
      lastReadAt: '5개월 전',
      rawDate: '2026-04-20 18:00',
      status: '암호화',
      security: '대외비',
      docType: '공유받은 문서',
      version: 'v1.4',
      fileSize: '12.1 MB',
      round: '1회독 진행중',
      coverBg: 'from-purple-600 to-indigo-900',
      accentColor: 'border-purple-500/40 text-purple-300',
    },
    {
      id: 'doc-04',
      title: '그리스 로마 신화와 현대 철학적 담론의 만남: 원형 분석과 인문학적 고찰',
      author: '김인문 교수',
      publisher: '민음사',
      isbn: '978-89-374-1234-5',
      categoryId: 'cat-cult-hist',
      categoryPath: '교양 / 인문 > 역사 / 철학',
      lastCategory: '역사 / 철학',
      totalPages: 450,
      readPages: 45,
      progressPercent: 10,
      lastReadAt: '오래됨 (1년 이상)',
      rawDate: '2025-02-11 14:00',
      status: '대기',
      security: '일반',
      docType: '등록문서',
      version: 'v1.0',
      fileSize: '8.7 MB',
      round: '1회독 입문',
      coverBg: 'from-amber-600 to-orange-800',
      accentColor: 'border-amber-500/40 text-amber-300',
    },
    {
      id: 'doc-05',
      title: '오리엔트 특급 살인 사건과 현대 추리 문학의 플롯 구조 분석',
      author: '아가사 크리스티 저 / 정추리 역',
      publisher: '황금가지',
      isbn: '978-89-527-7890-1',
      categoryId: 'cat-myste',
      categoryPath: '추리 / 소설',
      lastCategory: '추리 / 소설',
      totalPages: 280,
      readPages: 280,
      progressPercent: 100,
      lastReadAt: '3일 전',
      rawDate: '2026-09-27 21:40',
      status: 'OCR완료',
      security: '일반',
      docType: '내가 공유한 문서',
      version: 'v1.0',
      fileSize: '6.2 MB',
      round: '완독 (1회독)',
      coverBg: 'from-rose-600 to-red-900',
      accentColor: 'border-rose-500/40 text-rose-300',
    },
    {
      id: 'doc-06',
      title: '2027 글로벌 매크로 경제 전망 및 인플레이션 헤지 포트폴리오 전략 보고서',
      author: '홍길동 수석연구원',
      publisher: '글로벌투자전략연구소',
      isbn: '978-89-6077-889-0',
      categoryId: 'share-hong',
      categoryPath: '홍길동 팀장 공유함',
      lastCategory: '팀장 공유함',
      totalPages: 160,
      readPages: 120,
      progressPercent: 75,
      lastReadAt: '10분 전',
      rawDate: '2026-09-30 15:10',
      status: '암호화',
      security: '극비',
      docType: '공유받은 문서',
      version: 'v2.0',
      fileSize: '9.5 MB',
      round: '2회독 분석',
      coverBg: 'from-cyan-600 to-blue-900',
      accentColor: 'border-cyan-500/40 text-cyan-300',
    },
  ];

  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);

  // 콤보박스 팝오버 상태
  const [isCatComboboxOpen, setIsCatComboboxOpen] = useState(false);
  const [catComboboxFilterText, setCatComboboxFilterText] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);

  // 상세 검색 필터 조건
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterAuthor, setFilterAuthor] = useState<string>('');
  const [filterIsbn, setFilterIsbn] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSecurity, setFilterSecurity] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');

  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // 다운로드 모달
  const [activeDownloadDoc, setActiveDownloadDoc] = useState<DocumentItem | null>(null);

  // PDF 등록 모달
  const [isPdfUploadModalOpen, setIsPdfUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('cat-dev-fe');
  const [uploadFileName, setUploadFileName] = useState('');
  const [hasUserEditedTitle, setHasUserEditedTitle] = useState(false);

  // 8. PDF 생성 모달 상태 (8.1 고정비율, 8.2 다중선택, 8.3 첫/끝페이지 이동, 8.4 가로폭 조절)
  const [isImageToPdfModalOpen, setIsImageToPdfModalOpen] = useState(false);
  const [thumbnailLayout, setThumbnailLayout] = useState<'1row' | '3row' | '5row' | '10row'>('1row');
  const [thumbnailScale, setThumbnailScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [pdfModalWidth, setPdfModalWidth] = useState<'2xl' | '4xl' | '6xl'>('2xl');
  const [selectedThumbnails, setSelectedThumbnails] = useState<number[]>([]);
  const [targetPageInput, setTargetPageInput] = useState('');

  const [imageThumbnails, setImageThumbnails] = useState<string[]>([
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=200&q=80',
  ]);
  const [zipFileName, setZipFileName] = useState('');

  // 이미지 편집레이어(자르기/표준화) 팝업
  const [isImageEditLayerOpen, setIsImageEditLayerOpen] = useState(false);

  // ==========================================
  // 3. 카테고리 트리 & 계산 로직
  // ==========================================

  const getNodeDepth = (nodeId: string | null): number => {
    if (!nodeId) return 0;
    const node = categories.find((c) => c.id === nodeId);
    if (!node || node.parentId === null) return 1;
    return 1 + getNodeDepth(node.parentId);
  };

  const getNodeFullPath = (nodeId: string): string => {
    const node = categories.find((c) => c.id === nodeId);
    if (!node) return '';
    if (!node.parentId) return node.name;
    const parentPath = getNodeFullPath(node.parentId);
    return parentPath ? `${parentPath} > ${node.name}` : node.name;
  };

  // 5. 루트 문서수는 '공유문서 제외' 건수 표시
  const getDocCountForCategory = (catId: string | null): number => {
    if (catId === null) {
      return documents.filter((d) => d.docType !== '공유받은 문서').length;
    }
    return documents.filter((d) => d.categoryId === catId).length;
  };

  const handleExpandAll = () => {
    setCategories((prev) => prev.map((c) => ({ ...c, isOpen: true })));
  };
  const handleCollapseAll = () => {
    setCategories((prev) => prev.map((c) => ({ ...c, isOpen: false })));
  };

  const toggleNodeOpen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isOpen: !c.isOpen } : c))
    );
  };

  const handleStartAddNode = (targetParentId: string | null) => {
    const currentDepth = targetParentId ? getNodeDepth(targetParentId) : 0;
    if (currentDepth >= 5) {
      showCatNotice('⚠️ 카테고리는 최대 5단계 깊이까지만 추가할 수 있습니다.');
      return;
    }
    setIsAddingUnderNodeId(targetParentId || 'root');
    setNewCategoryName('');
  };

  const handleSaveNewNode = () => {
    if (!newCategoryName.trim()) {
      showCatNotice('⚠️ 카테고리 명칭을 입력해주세요.');
      return;
    }
    const parentId = isAddingUnderNodeId === 'root' ? null : isAddingUnderNodeId;
    const parentDepth = getNodeDepth(parentId);
    if (parentDepth >= 5) {
      showCatNotice('⚠️ 카테고리는 최대 5단계 깊이까지만 지원됩니다.');
      return;
    }

    const sameLevel = categories.filter((c) => c.parentId === parentId);
    const newOrder = sameLevel.length + 1;
    const newId = `cat-${Date.now()}`;

    const newCat: CategoryNode = {
      id: newId,
      name: newCategoryName.trim(),
      parentId,
      isOpen: true,
      order: newOrder,
    };

    setCategories((prev) => [...prev, newCat]);
    setIsAddingUnderNodeId(null);
    setNewCategoryName('');
    setSelectedEditNodeId(newId);
    if (isSyncSelectionWithList || !isEditCategoryMode) {
      setSelectedCatId(newId);
    }
    showCatNotice(`✅ 새 카테고리 '${newCat.name}'가 추가되었습니다.`);
  };

  const handleSaveRenameNode = (id: string) => {
    if (!editingNodeName.trim()) return;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editingNodeName.trim() } : c))
    );
    setEditingNodeId(null);
    setEditingNodeName('');
    showCatNotice('✅ 카테고리 명칭이 변경되었습니다.');
  };

  const handleDeleteNode = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    const docCount = getDocCountForCategory(id);
    if (docCount > 0) {
      showCatNotice(`⛔ [삭제 불가] '${target.name}'에 소속된 도서(${docCount}건)가 존재합니다.`);
      return;
    }

    const hasChildren = categories.some((c) => c.parentId === id);
    if (hasChildren) {
      showCatNotice(`⛔ [삭제 불가] 하위 카테고리가 존재합니다. 하위 카테고리를 먼저 정리해주세요.`);
      return;
    }

    const parentNodeId = target.parentId;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setSelectedEditNodeId(parentNodeId);
    if (isSyncSelectionWithList || !isEditCategoryMode) {
      setSelectedCatId(parentNodeId || null);
    }
    showCatNotice(`🗑️ 카테고리 '${target.name}'가 삭제되었으며, 부모 노드가 선택되었습니다.`);
  };

  // 6. 공유받은 계정 폴더 및 일반 카테고리 순서 변경 지원
  const handleMoveNodeUp = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    if (target.isShared) {
      const sharedList = categories.filter((c) => c.isShared).sort((a, b) => a.order - b.order);
      const currIdx = sharedList.findIndex((c) => c.id === id);
      if (currIdx <= 0) return;
      const reordered = [...sharedList];
      const temp = reordered[currIdx - 1];
      reordered[currIdx - 1] = reordered[currIdx];
      reordered[currIdx] = temp;

      const orderMap = new Map<string, number>();
      reordered.forEach((node, idx) => orderMap.set(node.id, idx + 1));

      setCategories((prev) =>
        prev.map((c) => (orderMap.has(c.id) ? { ...c, order: orderMap.get(c.id)! } : c))
      );
      showCatNotice(`▲ 공유폴더 '${target.name}' 순서가 위로 이동되었습니다.`);
      return;
    }

    // 개인 카테고리 순서 이동
    const sameLevel = categories
      .filter((c) => c.parentId === target.parentId && !c.isShared)
      .sort((a, b) => a.order - b.order);
    const currIdx = sameLevel.findIndex((c) => c.id === id);
    if (currIdx <= 0) return;
    const reordered = [...sameLevel];
    const temp = reordered[currIdx - 1];
    reordered[currIdx - 1] = reordered[currIdx];
    reordered[currIdx] = temp;

    const orderMap = new Map<string, number>();
    reordered.forEach((node, idx) => orderMap.set(node.id, idx + 1));

    setCategories((prev) =>
      prev.map((c) => (orderMap.has(c.id) ? { ...c, order: orderMap.get(c.id)! } : c))
    );
    showCatNotice(`▲ '${target.name}' 순서가 위로 이동되었습니다.`);
  };

  const handleMoveNodeDown = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    if (target.isShared) {
      const sharedList = categories.filter((c) => c.isShared).sort((a, b) => a.order - b.order);
      const currIdx = sharedList.findIndex((c) => c.id === id);
      if (currIdx >= sharedList.length - 1) return;
      const reordered = [...sharedList];
      const temp = reordered[currIdx + 1];
      reordered[currIdx + 1] = reordered[currIdx];
      reordered[currIdx] = temp;

      const orderMap = new Map<string, number>();
      reordered.forEach((node, idx) => orderMap.set(node.id, idx + 1));

      setCategories((prev) =>
        prev.map((c) => (orderMap.has(c.id) ? { ...c, order: orderMap.get(c.id)! } : c))
      );
      showCatNotice(`▼ 공유폴더 '${target.name}' 순서가 아래로 이동되었습니다.`);
      return;
    }

    const sameLevel = categories
      .filter((c) => c.parentId === target.parentId && !c.isShared)
      .sort((a, b) => a.order - b.order);
    const currIdx = sameLevel.findIndex((c) => c.id === id);
    if (currIdx >= sameLevel.length - 1) return;
    const reordered = [...sameLevel];
    const temp = reordered[currIdx + 1];
    reordered[currIdx + 1] = reordered[currIdx];
    reordered[currIdx] = temp;

    const orderMap = new Map<string, number>();
    reordered.forEach((node, idx) => orderMap.set(node.id, idx + 1));

    setCategories((prev) =>
      prev.map((c) => (orderMap.has(c.id) ? { ...c, order: orderMap.get(c.id)! } : c))
    );
    showCatNotice(`▼ '${target.name}' 순서가 아래로 이동되었습니다.`);
  };

  const handleNodeClick = (nodeId: string | null) => {
    if (isEditCategoryMode) {
      setSelectedEditNodeId(nodeId);
      if (isSyncSelectionWithList) {
        setSelectedCatId(nodeId);
      }
    } else {
      setSelectedCatId(nodeId);
    }
  };

  // ==========================================
  // 4. 8.2 & 8.3 썸네일 다중 선택 및 첫/끝/좌우 일괄 이동
  // ==========================================
  const handleToggleSelectThumbnail = (idx: number) => {
    setSelectedThumbnails((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllThumbnails = () => {
    if (selectedThumbnails.length === imageThumbnails.length) {
      setSelectedThumbnails([]);
    } else {
      setSelectedThumbnails(imageThumbnails.map((_, i) => i));
    }
  };

  // 8.3 선택된 이미지들을 맨 앞으로 이동 ([|◀])
  const handleMoveSelectedToFirst = () => {
    if (selectedThumbnails.length === 0) {
      showCatNotice('이동할 썸네일을 먼저 체크박스로 선택해주세요.');
      return;
    }
    const selectedSet = new Set(selectedThumbnails);
    const selectedItems = imageThumbnails.filter((_, i) => selectedSet.has(i));
    const remainingItems = imageThumbnails.filter((_, i) => !selectedSet.has(i));
    const nextArr = [...selectedItems, ...remainingItems];

    setImageThumbnails(nextArr);
    setSelectedThumbnails(selectedItems.map((_, i) => i));
    showCatNotice(`⏮️ 선택된 ${selectedItems.length}장의 이미지가 맨 앞으로 이동되었습니다.`);
  };

  // 8.3 선택된 이미지들을 맨 뒤로 이동 ([▶|])
  const handleMoveSelectedToLast = () => {
    if (selectedThumbnails.length === 0) {
      showCatNotice('이동할 썸네일을 먼저 체크박스로 선택해주세요.');
      return;
    }
    const selectedSet = new Set(selectedThumbnails);
    const selectedItems = imageThumbnails.filter((_, i) => selectedSet.has(i));
    const remainingItems = imageThumbnails.filter((_, i) => !selectedSet.has(i));
    const nextArr = [...remainingItems, ...selectedItems];

    setImageThumbnails(nextArr);
    const startIdx = remainingItems.length;
    setSelectedThumbnails(selectedItems.map((_, i) => startIdx + i));
    showCatNotice(`⏭️ 선택된 ${selectedItems.length}장의 이미지가 맨 뒤로 이동되었습니다.`);
  };

  // 선택된 이미지들을 한 칸 앞으로 이동 ([◀])
  const handleMoveSelectedPrev = () => {
    if (selectedThumbnails.length === 0) return;
    const sorted = [...selectedThumbnails].sort((a, b) => a - b);
    if (sorted[0] === 0) return; // 이미 맨 앞

    const nextArr = [...imageThumbnails];
    const newSelected: number[] = [];

    for (const idx of sorted) {
      const temp = nextArr[idx - 1];
      nextArr[idx - 1] = nextArr[idx];
      nextArr[idx] = temp;
      newSelected.push(idx - 1);
    }
    setImageThumbnails(nextArr);
    setSelectedThumbnails(newSelected);
  };

  // 선택된 이미지들을 한 칸 뒤로 이동 ([▶])
  const handleMoveSelectedNext = () => {
    if (selectedThumbnails.length === 0) return;
    const sorted = [...selectedThumbnails].sort((a, b) => b - a);
    if (sorted[0] === imageThumbnails.length - 1) return; // 이미 맨 뒤

    const nextArr = [...imageThumbnails];
    const newSelected: number[] = [];

    for (const idx of sorted) {
      const temp = nextArr[idx + 1];
      nextArr[idx + 1] = nextArr[idx];
      nextArr[idx] = temp;
      newSelected.push(idx + 1);
    }
    setImageThumbnails(nextArr);
    setSelectedThumbnails(newSelected);
  };

  // [요청 2] 선택된 이미지들을 사용자가 입력한 특정 페이지 번호 위치로 즉시 이동
  const handleMoveSelectedToPage = () => {
    const targetPage = parseInt(targetPageInput.trim(), 10);
    if (isNaN(targetPage) || targetPage < 1 || targetPage > imageThumbnails.length) {
      showCatNotice(`⚠️ 이동할 페이지 번호를 1부터 ${imageThumbnails.length} 사이로 입력해주세요.`);
      return;
    }
    const targetIdx = targetPage - 1; // 0-based
    const selectedSet = new Set(selectedThumbnails);
    const selectedItems = imageThumbnails.filter((_, i) => selectedSet.has(i));
    const remainingItems = imageThumbnails.filter((_, i) => !selectedSet.has(i));

    const clampedIdx = Math.min(targetIdx, remainingItems.length);
    const nextArr = [
      ...remainingItems.slice(0, clampedIdx),
      ...selectedItems,
      ...remainingItems.slice(clampedIdx),
    ];

    setImageThumbnails(nextArr);
    const newSelected = selectedItems.map((_, i) => clampedIdx + i);
    setSelectedThumbnails(newSelected);
    setTargetPageInput('');
    showCatNotice(`🚀 선택된 ${selectedItems.length}장의 이미지가 #${targetPage} 페이지 위치로 이동되었습니다.`);
  };

  // ==========================================
  // 5. 필터링 로직
  // ==========================================
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedCatId) {
        const isSelf = doc.categoryId === selectedCatId;
        const isChildOfSelected = (childCatId: string): boolean => {
          let curr = categories.find((c) => c.id === childCatId);
          while (curr && curr.parentId) {
            if (curr.parentId === selectedCatId) return true;
            curr = categories.find((c) => c.id === curr!.parentId);
          }
          return false;
        };
        if (!isSelf && !isChildOfSelected(doc.categoryId)) return false;
      }

      if (hideSharedFolders && doc.docType === '공유받은 문서') return false;
      if (filterDocType !== 'all' && doc.docType !== filterDocType) return false;

      if (filterKeyword.trim()) {
        const kw = filterKeyword.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(kw);
        const matchAuthor = doc.author.toLowerCase().includes(kw);
        if (!matchTitle && !matchAuthor) return false;
      }

      if (filterAuthor.trim()) {
        const kw = filterAuthor.toLowerCase();
        const matchAuthor = doc.author.toLowerCase().includes(kw);
        const matchPub = doc.publisher.toLowerCase().includes(kw);
        if (!matchAuthor && !matchPub) return false;
      }

      if (filterIsbn.trim() && doc.isbn) {
        if (!doc.isbn.includes(filterIsbn.trim())) return false;
      }

      if (filterStatus !== 'all' && doc.status !== filterStatus) return false;
      if (filterSecurity !== 'all' && doc.security !== filterSecurity) return false;

      return true;
    });
  }, [
    documents,
    selectedCatId,
    hideSharedFolders,
    categories,
    filterDocType,
    filterKeyword,
    filterAuthor,
    filterIsbn,
    filterStatus,
    filterSecurity,
  ]);

  const handleResetFilters = () => {
    setSelectedCatId(null);
    setSelectedEditNodeId(null);
    setFilterDocType('all');
    setFilterKeyword('');
    setFilterAuthor('');
    setFilterIsbn('');
    setFilterStatus('all');
    setFilterSecurity('all');
    setFilterDateRange('all');
    showCatNotice('🔄 검색 필터 조건이 초기화되었습니다.');
  };

  const comboboxFilteredCategories = useMemo(() => {
    const list: { node: CategoryNode; fullPath: string; depth: number }[] = [];
    const traverse = (parentId: string | null) => {
      const children = categories
        .filter((c) => c.parentId === parentId)
        .sort((a, b) => a.order - b.order);
      for (const child of children) {
        const depth = getNodeDepth(child.id);
        const fullPath = getNodeFullPath(child.id);
        list.push({ node: child, fullPath, depth });
        traverse(child.id);
      }
    };
    traverse(null);

    if (!catComboboxFilterText.trim()) return list;
    const kw = catComboboxFilterText.toLowerCase();
    return list.filter((item) => item.fullPath.toLowerCase().includes(kw));
  }, [categories, catComboboxFilterText]);

  // 1. 경로(Path) 모드 전용 평탄화 리스트 (한 줄 전체 path 표시)
  const flatCategoryPaths = useMemo(() => {
    return categories
      .filter((c) => !hideSharedFolders || !c.isShared)
      .map((c) => ({
        id: c.id,
        fullPath: c.isShared ? `[공유함] ${c.name}` : getNodeFullPath(c.id),
        docCount: getDocCountForCategory(c.id),
        isShared: c.isShared,
      }))
      .sort((a, b) => a.fullPath.localeCompare(b.fullPath));
  }, [categories, documents, hideSharedFolders]);

  const handleSelectPdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    if (!hasUserEditedTitle || !uploadTitle.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(nameWithoutExt);
    }
  };

  const handleAddNewPdf = () => {
    if (!uploadTitle.trim()) {
      alert('문서표지명을 입력해주세요.');
      return;
    }
    const cat = categories.find((c) => c.id === uploadCategory) || categories[0];
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: uploadTitle.trim(),
      author: 'jkok2j2m (직접 등록)',
      publisher: 'purePDFrend 디지털서재',
      categoryId: cat.id,
      categoryPath: getNodeFullPath(cat.id),
      lastCategory: cat.name.split('/')[0].trim(),
      totalPages: 120,
      readPages: 1,
      progressPercent: 1,
      lastReadAt: '10분 전',
      rawDate: new Date().toISOString(),
      status: 'OCR완료',
      security: '일반',
      docType: '등록문서',
      version: 'v1.0 (목차/주석/OCR 추출완료)',
      fileSize: uploadFileName ? '48.2 MB' : '12.5 MB',
      round: '1회독 입문',
      coverBg: 'from-sky-600 to-indigo-800',
      accentColor: 'border-sky-500/40 text-sky-300',
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setIsPdfUploadModalOpen(false);
    setUploadTitle('');
    setUploadFileName('');
    setHasUserEditedTitle(false);
    showCatNotice(`🎉 신규 PDF '${newDoc.title}'가 등록되었습니다.`);
  };

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipFileName(file.name);
    setImageThumbnails([
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=200&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=200&q=80',
    ]);
    setSelectedThumbnails([]);
    showCatNotice(`📦 압축 파일 '${file.name}'에서 6장의 페이지 이미지가 추출되었습니다.`);
  };

  const handleApplyImageEditSettings = (
    crop: ImageCropSettings,
    std: ImageStandardizeSettings
  ) => {
    const cat = categories.find((c) => c.id === uploadCategory) || categories[0];
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: uploadTitle.trim() || '바이브 코딩: 프로덕션의 원칙 (스캔 PDF)',
      author: '진 킴, 스티브 예기 (이보라 역)',
      publisher: 'Jpub 출판사',
      isbn: '979-11-9234-567-8',
      categoryId: cat.id,
      categoryPath: getNodeFullPath(cat.id),
      lastCategory: cat.name.split('/')[0].trim(),
      totalPages: 504,
      readPages: 1,
      progressPercent: 1,
      lastReadAt: '10분 전',
      rawDate: new Date().toISOString(),
      status: 'OCR완료',
      security: '일반',
      docType: '등록문서',
      version: `v1.0 (자르기:${crop.enabled ? 'ON' : 'OFF'}, 표준화:${std.enabled ? 'A4' : 'OFF'})`,
      fileSize: '34.8 MB',
      round: '1회독 입문',
      coverBg: 'from-slate-950 via-slate-900 to-red-950',
      accentColor: 'border-rose-500/40 text-rose-300',
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setIsImageToPdfModalOpen(false);
    setUploadTitle('');
    setZipFileName('');
    setSelectedThumbnails([]);
    showCatNotice(`🎉 자르기/표준화 설정이 반영된 신규 PDF '${newDoc.title}'(504쪽)가 생성되었습니다.`);
  };

  // 재귀 트리 렌더러
  const renderCategoryItem = (node: CategoryNode, depth: number) => {
    const children = categories
      .filter((c) => c.parentId === node.id)
      .sort((a, b) => a.order - b.order);

    const isCurrentSelected = isEditCategoryMode
      ? selectedEditNodeId === node.id
      : selectedCatId === node.id;

    const docCount = getDocCountForCategory(node.id);

    return (
      <div key={node.id} className="space-y-1">
        <div
          onClick={() => handleNodeClick(node.id)}
          style={{ paddingLeft: `${Math.max(4, (depth - 1) * 12)}px` }}
          className={`p-1.5 rounded-lg flex items-center justify-between cursor-pointer border transition-all text-xs group ${
            isCurrentSelected
              ? depth === 1
                ? 'bg-indigo-950/70 border-indigo-500/80 text-white font-bold shadow-xs'
                : 'bg-sky-950/70 border-sky-500/80 text-white font-bold shadow-xs'
              : 'bg-slate-900/40 hover:bg-slate-900 border-transparent hover:border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {children.length > 0 ? (
              <button
                type="button"
                onClick={(e) => toggleNodeOpen(node.id, e)}
                className="p-0.5 rounded hover:bg-slate-800 text-slate-400"
              >
                {node.isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {depth > 1 && <span className="w-2 border-b-2 border-slate-600 inline-block shrink-0" />}

            {node.isOpen && children.length > 0 ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            )}

            {editingNodeId === node.id ? (
              <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editingNodeName}
                  onChange={(e) => setEditingNodeName(e.target.value)}
                  className="bg-slate-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white flex-1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveRenameNode(node.id)}
                  className="p-1 rounded bg-amber-600 text-white"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-slate-400 font-mono bg-slate-950/80 px-1.5 py-0.2 rounded border border-slate-800/80">
              {docCount}
            </span>
          </div>
        </div>

        {node.isOpen && children.length > 0 && (
          <div className="border-l border-slate-800/80 space-y-1">
            {children.map((child) => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 text-xs select-none ${className}`}>
      {categoryNotice && (
        <div className="fixed top-16 right-6 z-50 px-3.5 py-2 rounded-xl bg-slate-900 border border-sky-500/60 text-sky-200 text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>🔔</span>
          <span>{categoryNotice}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. 상단 상세 검색 필터 바 (2. 모바일 반응형 래핑 & 초기화 아이콘화) */}
      {/* ========================================================= */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm mb-5 space-y-3">
        {/* [요청 2] 타이틀 좁을 때 타이틀 밑에 배치 (flex-col sm:flex-row) & 초기화 아이콘화 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
              <Search className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-white tracking-tight">문서 상세 검색 필터</span>
            <span className="text-[10px] text-slate-500 font-mono">
              (총 {documents.length}건 중 <strong className="text-sky-400">{filteredDocuments.length}</strong>건)
            </span>
          </div>

          {/* 우측 컨트롤러: [상세필터 토글] + [2. 초기화 아이콘 버튼] */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isAdvancedFilterOpen
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
              title={isAdvancedFilterOpen ? '상세 필터 접기' : '상세 필터 펼치기'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono">{isAdvancedFilterOpen ? '▲' : '▼'}</span>
            </button>

            {/* [요청 2] 초기화 버튼 아이콘으로 변경 */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
              title="검색 필터 조건 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 기본 검색 4종 필터 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400">문서 구분</label>
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
            >
              <option value="all">전체 문서 구분</option>
              <option value="등록문서">등록문서 (내 라이브러리)</option>
              <option value="내가 공유한 문서">내가 공유한 문서</option>
              <option value="공유받은 문서">공유받은 문서 (외부)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400">문서명 / 등록자</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="문서명 또는 등록자..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 pr-7 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
              />
              {filterKeyword && (
                <button
                  type="button"
                  onClick={() => setFilterKeyword('')}
                  className="absolute right-2 text-slate-500 hover:text-slate-300"
                  title="지우기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400">출판사 / 저자 / 역자</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                placeholder="저자, 출판사, 역자명..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 pr-7 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
              />
              {filterAuthor && (
                <button
                  type="button"
                  onClick={() => setFilterAuthor('')}
                  className="absolute right-2 text-slate-500 hover:text-slate-300"
                  title="지우기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 카테고리 검색/선택 콤보박스 */}
          <div className="space-y-1 relative" ref={comboboxRef}>
            <label className="text-[10px] font-semibold text-slate-400">카테고리 선택 / 검색</label>
            <div
              onClick={() => setIsCatComboboxOpen(!isCatComboboxOpen)}
              className="w-full bg-slate-900 border border-slate-700/80 hover:border-sky-500 rounded-lg p-2 flex items-center justify-between text-slate-200 text-xs cursor-pointer select-none"
            >
              <span className="truncate">
                {selectedCatId ? getNodeFullPath(selectedCatId) : '전체 카테고리'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {selectedCatId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCatId(null);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-200"
                    title="선택 해제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {isCatComboboxOpen && (
              <div className="absolute top-full left-0 mt-1 w-full sm:w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-2 animate-in fade-in">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={catComboboxFilterText}
                    onChange={(e) => setCatComboboxFilterText(e.target.value)}
                    placeholder="카테고리명 검색 (예: 프론트, React)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 pr-7 text-white text-xs"
                    autoFocus
                  />
                  {catComboboxFilterText && (
                    <button
                      type="button"
                      onClick={() => setCatComboboxFilterText('')}
                      className="absolute right-2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatId(null);
                      setIsCatComboboxOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${
                      selectedCatId === null ? 'bg-sky-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>전체 카테고리</span>
                    <span className="text-[10px] font-mono">({getDocCountForCategory(null)})</span>
                  </button>

                  {comboboxFilteredCategories.map(({ node, fullPath, depth }) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => {
                        setSelectedCatId(node.id);
                        setIsCatComboboxOpen(false);
                      }}
                      style={{ paddingLeft: `${Math.max(8, depth * 8)}px` }}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between truncate ${
                        selectedCatId === node.id
                          ? 'bg-sky-600 text-white font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="truncate">{fullPath}</span>
                      <span className="text-[10px] font-mono shrink-0 ml-1 text-slate-400">
                        ({getDocCountForCategory(node.id)})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {isAdvancedFilterOpen && (
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">ISBN 번호</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={filterIsbn}
                  onChange={(e) => setFilterIsbn(e.target.value)}
                  placeholder="예: 978-89-..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 pr-7 text-slate-200 focus:outline-none focus:border-sky-500 text-xs font-mono"
                />
                {filterIsbn && (
                  <button
                    type="button"
                    onClick={() => setFilterIsbn('')}
                    className="absolute right-2 text-slate-500 hover:text-slate-300"
                    title="지우기"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">처리 상태</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
              >
                <option value="all">전체 상태</option>
                <option value="대기">대기</option>
                <option value="OCR완료">OCR완료</option>
                <option value="암호화">암호화 보호</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">보안 등급</label>
              <select
                value={filterSecurity}
                onChange={(e) => setFilterSecurity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
              >
                <option value="all">전체 등급</option>
                <option value="일반">일반 (공개)</option>
                <option value="대외비">대외비 (기밀)</option>
                <option value="극비">극비 (인증필수)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">등록 / 열람 시점</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
              >
                <option value="all">전체 기간</option>
                <option value="7days">최근 7일 이내</option>
                <option value="1month">최근 1개월 이내</option>
                <option value="1year">최근 1년 이내</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. 메인 레이아웃 (3. 카테고리 접기/펼치기 지원: 데스크톱 좌우 / 모바일 상하) */}
      {/* ========================================================= */}
      <div className={`grid grid-cols-1 ${isMobileMode ? 'w-full' : 'lg:grid-cols-12'} gap-5 items-start`}>
        {/* ========================================================= */}
        {/* [좌측 패널: 3. 접기/펼치기 반응형 적용 (모바일: 위로접기 / 데스크톱: 왼쪽으로접기)] */}
        {/* ========================================================= */}
        <div
          className={`transition-all duration-300 ${
            isMobileMode
              ? 'w-full'
              : isCategoryCollapsed
              ? 'w-full lg:col-span-1'
              : 'lg:col-span-4'
          }`}
        >
          {isCategoryCollapsed ? (
            <>
              {/* [모바일 접힘 모드] 상단 위로접힌 컴팩트 단일 배너 (isMobileMode이거나 모바일 해상도(lg 미만)에서 상시 표시) */}
              <div
                onClick={() => setIsCategoryCollapsed(false)}
                className={`${
                  isMobileMode ? 'flex' : 'flex lg:hidden'
                } w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 shadow-sm items-center justify-between transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-white text-xs">도서 카테고리</span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    위로 접힘
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryCollapsed(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="카테고리 아래로 펼치기"
                >
                  <span>펼치기</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* [데스크톱 접힘 모드] 슬림한 세로 확장 바 (isMobileMode가 아닐 때 데스크톱(lg 이상)에서만 표시) */}
              {!isMobileMode && (
                <div className="hidden lg:flex flex-col items-center py-4 px-2 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setIsCategoryCollapsed(false)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    title="카테고리 펼치기 (오른쪽으로 확장)"
                  >
                    <PanelLeftOpen className="w-4 h-4 text-sky-400 hover:text-white" />
                  </button>
                  <div
                    onClick={() => setIsCategoryCollapsed(false)}
                    className="[writing-mode:vertical-lr] text-xs font-bold text-slate-400 hover:text-white tracking-widest cursor-pointer py-4"
                  >
                    도서 카테고리
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 카테고리 기본 패널 */
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 shadow-sm space-y-3">
              {/* 헤더: [3. (최대 5Depth) 삭제], [3. 데스크톱/모바일 접기 토글], [4. 트리/경로 아이콘화] */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-sky-400" />
                  {/* [요청 3] (최대 5Depth) 삭제 */}
                  <span className="font-bold text-white text-xs">도서 카테고리</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* [요청 4] 트리, 경로 아이콘으로 변경 */}
                  <div className="flex rounded-md bg-slate-900 p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTreeViewMode('tree')}
                      className={`p-1 rounded text-xs transition-all ${
                        treeViewMode === 'tree' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="계층 트리 뷰"
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTreeViewMode('path')}
                      className={`p-1 rounded text-xs transition-all ${
                        treeViewMode === 'path' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="단일행 전체 경로 뷰"
                    >
                      <Route className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExpandAll}
                    className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs"
                    title="전체 펴기 [+]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs"
                    title="전체 접기 [-]"
                  >
                    -
                  </button>

                  {/* 접기 버튼: isMobileMode 명시적 분기 */}
                  {isMobileMode ? (
                    <button
                      type="button"
                      onClick={() => setIsCategoryCollapsed(true)}
                      className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                      title="카테고리 위로 접기"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsCategoryCollapsed(true)}
                        className="hidden lg:flex w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white items-center justify-center text-xs cursor-pointer"
                        title="왼쪽으로 카테고리 접기"
                      >
                        <PanelLeftClose className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCategoryCollapsed(true)}
                        className="flex lg:hidden w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white items-center justify-center text-xs cursor-pointer"
                        title="카테고리 위로 접기"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 카테고리 본문 */}
              <>
                  <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-[11px]">
                      <input
                        type="checkbox"
                        checked={hideSharedFolders}
                        onChange={(e) => setHideSharedFolders(e.target.checked)}
                        className="rounded border-slate-700 text-sky-600 focus:ring-sky-500 bg-slate-800 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-3 h-3 text-slate-400" />
                        <span>공유문서 숨기기</span>
                      </span>
                    </label>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      {categories.filter((c) => c.isShared).length}개 공유함
                    </span>
                  </div>

                  {/* 카테고리 본문: [트리 모드] vs [1. 경로(Path) 단일행 전체 path 뷰] */}
                  <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                    {/* [요청 5] 루트 문서수는 공유문서 제외 건수 표시 */}
                    <div
                      onClick={() => handleNodeClick(null)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer border transition-all select-none ${
                        (isEditCategoryMode ? selectedEditNodeId === null : selectedCatId === null)
                          ? 'bg-sky-950/70 border-sky-500/60 text-white shadow-xs'
                          : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="p-1 rounded bg-sky-500/20 text-sky-400">👤</span>
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate flex items-center gap-1.5">
                            <span>{userEmail}</span>
                            <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono">내 서재(루트)</span>
                          </div>
                          <div className="text-[10px] text-slate-500">등록 문서 (공유문서 제외)</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {getDocCountForCategory(null)}
                      </span>
                    </div>

                    {/* [요청 1] 경로 선택 시 댑스가 아니고 한 줄로 전체 path를 한 줄에 표시 */}
                    {treeViewMode === 'path' ? (
                      <div className="space-y-1 mt-2">
                        {flatCategoryPaths.map((item) => {
                          const isPathSelected = selectedCatId === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleNodeClick(item.id)}
                              className={`p-2 rounded-lg flex items-center justify-between cursor-pointer border transition-all text-xs group ${
                                isPathSelected
                                  ? 'bg-sky-950/70 border-sky-500 text-white font-bold'
                                  : 'bg-slate-900/40 hover:bg-slate-900 border-slate-800/80 text-slate-300'
                              }`}
                              title={item.fullPath}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <Route className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate text-[11px]">{item.fullPath}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono ml-1.5 shrink-0 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                {item.docCount}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* 트리 계층 모드 */
                      <div className="pl-2 border-l-2 border-slate-800/80 space-y-1 mt-2">
                        {categories
                          .filter((c) => c.parentId === null && !c.isShared)
                          .sort((a, b) => a.order - b.order)
                          .map((rootNode) => renderCategoryItem(rootNode, 1))}
                      </div>
                    )}

                    {/* 공유받은 계정의 폴더 목록 (6. 원래공유명 툴팁 & 순서변경 가능 텍스트 제거) */}
                    {!hideSharedFolders && (
                      <div className="pt-2.5 mt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 px-1 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>공유받은 계정 폴더</span>
                          </span>
                        </div>

                        <div className="space-y-1 pl-2 border-l border-indigo-900/60">
                          {categories
                            .filter((c) => c.isShared)
                            .sort((a, b) => a.order - b.order)
                            .map((shareNode) => {
                              const isShareSelected = isEditCategoryMode
                                ? selectedEditNodeId === shareNode.id
                                : selectedCatId === shareNode.id;
                              const shareDocCount = getDocCountForCategory(shareNode.id);

                              return (
                                <div
                                  key={shareNode.id}
                                  onClick={() => handleNodeClick(shareNode.id)}
                                  className={`p-1.5 rounded-lg flex items-center justify-between cursor-pointer border transition-all text-xs group ${
                                    isShareSelected
                                      ? 'bg-purple-950/70 border-purple-500 text-white'
                                      : 'bg-slate-900/30 hover:bg-slate-900 border-transparent text-slate-300'
                                  }`}
                                  /* [요청 6] 이름변경 가능 마우스오버시 원래 공유명 툴팁 표시 */
                                  title={`원래 공유명: ${shareNode.sharedOwner || ''} (${shareNode.name})`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                    {editingNodeId === shareNode.id ? (
                                      <div
                                        className="flex items-center gap-1 flex-1 min-w-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="text"
                                          value={editingNodeName}
                                          onChange={(e) => setEditingNodeName(e.target.value)}
                                          className="bg-slate-950 border border-purple-500 rounded px-1 py-0.5 text-xs text-white flex-1"
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveRenameNode(shareNode.id)}
                                          className="p-1 rounded bg-purple-600 text-white"
                                        >
                                          <Check className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="min-w-0">
                                        <div className="font-semibold truncate text-[11px]">{shareNode.name}</div>
                                        <div className="text-[9px] text-slate-500 font-mono">{shareNode.sharedOwner}</div>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-purple-300 font-mono bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/60 shrink-0">
                                    {shareDocCount}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 편집 툴바: [3. (5Depth) 삭제], [7. 연동기능 타이틀 삭제하고 아이콘만 표시] */}
                  <div className="pt-3 border-t border-slate-800">
                    {isEditCategoryMode ? (
                      <div className="space-y-2 p-2.5 bg-slate-900/90 border border-amber-500/50 rounded-xl animate-in fade-in">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                          {/* [요청 3] (5Depth) 삭제 */}
                          <span>🛠️ 카테고리 편집 모드</span>
                          <div className="flex items-center gap-1">
                            {/* [요청 7] 연동기능 타이틀 삭제하고 아이콘만 표시 */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = !isSyncSelectionWithList;
                                setIsSyncSelectionWithList(nextVal);
                                if (nextVal) {
                                  setSelectedCatId(selectedEditNodeId);
                                  showCatNotice('🔗 목록 실시간 연동 (켜짐)');
                                } else {
                                  showCatNotice('🔓 목록 연동 해제 (꺼짐)');
                                }
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isSyncSelectionWithList
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-xs'
                                  : 'bg-slate-900 text-slate-500 border-slate-800'
                              }`}
                              title={isSyncSelectionWithList ? '목록 실시간 연동 (켜짐)' : '목록 연동 해제 (꺼짐)'}
                            >
                              {isSyncSelectionWithList ? <Link2 className="w-3.5 h-3.5 text-sky-400" /> : <Link2Off className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsEditCategoryMode(false);
                                setEditingNodeId(null);
                                setIsAddingUnderNodeId(null);
                                showCatNotice('✅ 카테고리 수정 내용이 전체 반영되었습니다.');
                              }}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>완료</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400">
                          선택된 노드: <strong className="text-white">
                            {selectedEditNodeId ? getNodeFullPath(selectedEditNodeId) : '전체 (루트)'}
                          </strong>
                        </div>

                        {/* 5종 편집 아이콘: [+], [-], [▲], [▼], [연필] (6. 공유폴더 순서이동 및 별칭변경 지원) */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleStartAddNode(selectedEditNodeId)}
                            className="flex-1 py-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white flex items-center justify-center gap-1 font-semibold text-[10px] transition-colors"
                            title="선택된 노드 하위에 신규 카테고리 추가"
                          >
                            <Plus className="w-3 h-3 text-sky-400" />
                            <span>추가</span>
                          </button>

                          <button
                            type="button"
                            disabled={!selectedEditNodeId}
                            onClick={() => selectedEditNodeId && handleDeleteNode(selectedEditNodeId)}
                            className="flex-1 py-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800 flex items-center justify-center gap-1 font-semibold text-[10px] transition-colors"
                            title="선택된 노드 삭제 (삭제 후 부모노드 자동선택)"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>삭제</span>
                          </button>

                          <button
                            type="button"
                            disabled={!selectedEditNodeId}
                            onClick={() => selectedEditNodeId && handleMoveNodeUp(selectedEditNodeId)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 flex items-center justify-center"
                            title="위로 순서 이동 (공유폴더 포함)"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            type="button"
                            disabled={!selectedEditNodeId}
                            onClick={() => selectedEditNodeId && handleMoveNodeDown(selectedEditNodeId)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 flex items-center justify-center"
                            title="아래로 순서 이동 (공유폴더 포함)"
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            type="button"
                            disabled={!selectedEditNodeId}
                            onClick={() => {
                              if (!selectedEditNodeId) return;
                              const target = categories.find((c) => c.id === selectedEditNodeId);
                              if (target) {
                                setEditingNodeId(target.id);
                                setEditingNodeName(target.name);
                              }
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 flex items-center justify-center"
                            title="노드 이름 변경 (공유폴더 별칭 변경 포함)"
                          >
                            ✏️
                          </button>
                        </div>

                        {isAddingUnderNodeId && (
                          <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                            <div className="relative flex-1 flex items-center">
                              <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="새 카테고리명..."
                                className="w-full bg-slate-950 border border-sky-500 rounded px-2 py-1 pr-6 text-xs text-white"
                                autoFocus
                              />
                              {newCategoryName && (
                                <button
                                  type="button"
                                  onClick={() => setNewCategoryName('')}
                                  className="absolute right-1.5 text-slate-500 hover:text-slate-300"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={handleSaveNewNode}
                              className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[10px]"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingUnderNodeId(null)}
                              className="p-1 rounded text-slate-500 hover:text-slate-300"
                            >
                              취소
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditCategoryMode(true);
                          setSelectedEditNodeId(selectedCatId);
                        }}
                        className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center gap-1.5 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        <span>✏️</span>
                        <span>카테고리 편집 (순서/추가/삭제)</span>
                      </button>
                    )}
                  </div>
                </>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* [우측 패널: 데스크톱 접힘 시 전체 너비로 확장 / 모바일 w-full] */}
        {/* ========================================================= */}
        <div
          className={`space-y-4 transition-all duration-300 ${
            isMobileMode ? 'w-full' : isCategoryCollapsed ? 'lg:col-span-11' : 'lg:col-span-8'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-sm">
            <div className="inline-flex rounded-xl bg-slate-900 p-0.5 border border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => setIsPdfUploadModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="단일 PDF 파일 업로드 및 등록"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>+ PDF 등록</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImageToPdfModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border-l border-slate-800"
                title="이미지 또는 압축파일(ZIP)을 풀어서 새 PDF 생성"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>PDF 생성</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">
                {selectedCatId ? getNodeFullPath(selectedCatId) : '전체 서재'}
              </span>

              {/* [요청 1.2] 모바일 모드에서는 카드모드로 고정하고 뷰어모드 아이콘 2개 제거 */}
              {!isMobileMode && (
                <div className="hidden sm:flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      viewMode === 'card'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="카드 뷰"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="목록(테이블) 뷰"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 도서 목록 렌더링 (카드 뷰 vs 테이블 뷰 - 모바일은 카드 뷰 고정) */}
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-3xl">📭</span>
              <div className="text-slate-300 font-bold">조건에 맞는 도서가 없습니다.</div>
              <div className="text-slate-500 text-xs">검색어 또는 카테고리 필터 조건을 변경해보세요.</div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 text-xs font-semibold cursor-pointer"
              >
                검색 조건 초기화
              </button>
            </div>
          ) : (isMobileMode || viewMode === 'card') ? (
            <div className={`grid gap-3.5 ${isCollapsedDesktop ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    if (onOpenViewer) onOpenViewer(doc.id);
                  }}
                  className="p-3.5 bg-slate-950 border border-slate-800 hover:border-sky-500/60 rounded-2xl space-y-3 cursor-pointer transition-all group select-none shadow-sm flex flex-col justify-between"
                  title="클릭하여 뷰어로 열기"
                >
                  <div>
                    <div className="flex gap-3 items-start">
                      <div
                        className={`w-14 h-18 rounded-lg bg-gradient-to-br ${doc.coverBg} border border-white/10 shrink-0 p-1 flex flex-col justify-between shadow-md relative overflow-hidden`}
                      >
                        <div className="text-[6px] text-white/70 font-mono">purePDF</div>
                        <div className="text-[7px] text-white font-bold leading-tight line-clamp-2">
                          {doc.title.split(' ')[0]}
                        </div>
                        <div className="text-[6px] text-amber-300 font-mono">{doc.version.split(' ')[0]}</div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                            {doc.lastCategory}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{doc.lastReadAt}</span>
                        </div>

                        <div
                          className="overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] py-0.5 cursor-ew-resize select-none"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onWheel={(e) => {
                            e.stopPropagation();
                            e.currentTarget.scrollLeft += e.deltaY;
                          }}
                          title={`${doc.title} (마우스 휠/드래그로 긴 제목 가로 슬라이드)`}
                        >
                          <span className="font-bold text-white text-xs whitespace-nowrap group-hover:text-sky-300 transition-colors">
                            {doc.title}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{doc.author}</span>
                          <span className="text-slate-600">|</span>
                          <span>{doc.publisher}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-300">
                          <strong className="text-sky-400 font-bold">{doc.readPages}</strong> / {doc.totalPages} 쪽
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[9px]">
                            {doc.progressPercent}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{doc.round}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                          style={{ width: `${doc.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDownloadDoc(doc);
                      }}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>4종 다운로드</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenViewer) onOpenViewer(doc.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>뷰어로 열기</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="p-3">표지</th>
                      <th className="p-3">문서명 / 저자</th>
                      <th className="p-3">소속 카테고리</th>
                      <th className="p-3">독서 상태</th>
                      <th className="p-3">최종 열람</th>
                      <th className="p-3 text-center">다운로드</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        onClick={() => {
                          if (onOpenViewer) onOpenViewer(doc.id);
                        }}
                        className="hover:bg-slate-900/50 cursor-pointer transition-colors group"
                      >
                        <td className="p-3">
                          <div
                            className={`w-9 h-12 rounded bg-gradient-to-br ${doc.coverBg} border border-white/10 shrink-0 p-1 flex items-center justify-center text-[7px] text-white font-bold text-center`}
                          >
                            PDF
                          </div>
                        </td>
                        <td className="p-3 min-w-[200px]">
                          <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                            {doc.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {doc.author} · {doc.publisher}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-[10px]">
                            {doc.lastCategory}
                          </span>
                        </td>
                        <td className="p-3 min-w-[140px]">
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className="text-sky-400 font-bold">{doc.readPages} / {doc.totalPages}쪽</span>
                            <span className="text-emerald-400 font-bold">{doc.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500" style={{ width: `${doc.progressPercent}%` }} />
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-400">{doc.lastReadAt}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDownloadDoc(doc);
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="4종 다운로드"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. 모달 레이어들 */}
      {/* ========================================================= */}

      {/* PDF 등록 모달 */}
      {isPdfUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-sky-400" />
                <span>+ PDF 신규 등록</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPdfUploadModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/40 transition-colors">
              <Upload className="w-6 h-6 text-sky-400" />
              <div className="text-xs text-slate-200 font-semibold">
                {uploadFileName ? uploadFileName : 'PDF 파일을 드래그하거나 클릭하여 선택'}
              </div>
              <div className="text-[10px] text-slate-500">
                ⚡ 최대 2GB 대용량 문서 청크 가상 스트리밍 지원 (표지/목차 우선 렌더링)
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleSelectPdfFile}
                className="hidden"
              />
            </label>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">문서표지명 (제목)</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => {
                      setUploadTitle(e.target.value);
                      setHasUserEditedTitle(true);
                    }}
                    placeholder="도서 표지 제목 입력..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pr-7 text-white text-xs"
                  />
                  {uploadTitle && (
                    <button
                      type="button"
                      onClick={() => setUploadTitle('')}
                      className="absolute right-2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">소속 카테고리 (내 서재 전용)</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                >
                  {categories
                    .filter((c) => !c.isShared)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {getNodeFullPath(c.id)}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
                <div className="text-sky-300 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>자동 추출 파이프라인 탑재</span>
                </div>
                <div>업로드 완료 시 페이지별 썸네일, 목차(TOC), 주석, OCR 텍스트 레이어를 자동 추출하여 버전 카탈로그에 기록합니다.</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPdfUploadModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddNewPdf}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
              >
                등록 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PDF 생성 모달 (8.1 고정비율, 8.2 다중선택, 8.3 첫/끝페이지 이동, 8.4 가로폭 조절) */}
      {isImageToPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            className={`bg-slate-950 border border-slate-800 rounded-2xl w-full p-4 sm:p-5 space-y-4 shadow-2xl animate-in fade-in max-h-[92vh] overflow-y-auto transition-all ${
              pdfModalWidth === '2xl' ? 'max-w-2xl' : pdfModalWidth === '4xl' ? 'max-w-4xl' : 'max-w-6xl'
            }`}
          >
            {/* 모달 상단 헤더: 타이틀 + [8.4 가로폭 조절기] + 닫기 */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>PDF 생성 (이미지/압축파일 묶음)</span>
              </span>

              <div className="flex items-center gap-2">
                {/* [요청 1.1] 모바일 모드에서는 PDF생성 팝업크기 버튼 제거 */}
                {!isMobileMode && (
                  <div className="hidden sm:flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setPdfModalWidth('2xl')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        pdfModalWidth === '2xl' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      기본 (2XL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfModalWidth('4xl')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        pdfModalWidth === '4xl' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      넓게 (4XL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfModalWidth('6xl')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        pdfModalWidth === '6xl' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      최대 (6XL)
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsImageToPdfModalOpen(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-3.5 text-center flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-900/40 transition-colors">
              <Archive className="w-5 h-5 text-amber-400" />
              <div className="text-xs text-slate-200 font-semibold">
                {zipFileName ? `선택됨: ${zipFileName}` : '압축파일(ZIP) 또는 다중 이미지 파일 업로드'}
              </div>
              <div className="text-[10px] text-slate-500">
                ZIP 파일 선택 시 자동으로 압축을 풀어 순서대로 썸네일을 배치합니다.
              </div>
              <input
                type="file"
                multiple
                accept=".zip,image/jpeg,image/png,image/webp"
                onChange={handleZipUpload}
                className="hidden"
              />
            </label>

            {/* 썸네일 제어 툴바: [8.2 다중선택], [2. 페이지번호 인풋 이동 전환], [8.3 첫/끝페이지 이동], [보기줄수] */}
            <div className="space-y-2 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                {/* 8.2 다중 선택 및 [요청 2] 페이지 번호 입력필드 교체 & 이동 버튼 */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllThumbnails}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    {selectedThumbnails.length === imageThumbnails.length ? '전체 해제' : '전체 선택'}
                  </button>

                  {/* [요청 2] 이미지 선택 시 페이지 번호를 입력필드로 교체하고 이동버튼 배치 */}
                  {selectedThumbnails.length > 0 ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in bg-slate-950 px-2 py-0.5 rounded-lg border border-sky-500/60 shadow-xs">
                      <span className="text-sky-300 font-mono font-bold">
                        선택 {selectedThumbnails.length}장 ➔
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={imageThumbnails.length}
                        value={targetPageInput}
                        onChange={(e) => setTargetPageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleMoveSelectedToPage();
                        }}
                        placeholder="쪽번호"
                        className="w-14 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded px-1.5 py-0.5 text-[10px] text-white font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleMoveSelectedToPage}
                        className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] shadow-xs cursor-pointer flex items-center gap-0.5"
                        title="선택된 이미지를 입력한 쪽번호 위치로 이동"
                      >
                        <span>이동</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-mono">
                      총 <strong className="text-white">{imageThumbnails.length}</strong>쪽
                    </span>
                  )}

                  {/* 8.3 페이지이동 첫페이지, 끝페이지 아이콘 추가 및 한칸 이동 */}
                  <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                    <button
                      type="button"
                      disabled={selectedThumbnails.length === 0}
                      onClick={handleMoveSelectedToFirst}
                      className="p-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white disabled:opacity-40"
                      title="선택된 이미지를 맨 앞으로 이동 [|◀]"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={selectedThumbnails.length === 0}
                      onClick={handleMoveSelectedPrev}
                      className="p-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white disabled:opacity-40"
                      title="한 칸 앞으로 이동 [◀]"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={selectedThumbnails.length === 0}
                      onClick={handleMoveSelectedNext}
                      className="p-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white disabled:opacity-40"
                      title="한 칸 뒤로 이동 [▶]"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={selectedThumbnails.length === 0}
                      onClick={handleMoveSelectedToLast}
                      className="p-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white disabled:opacity-40"
                      title="선택된 이미지를 맨 뒤로 이동 [▶|]"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 썸네일 보기 줄수 및 8.4 가로크기 스위처 */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">보기 줄수:</span>
                    <div className="flex rounded-md bg-slate-950 p-0.5 border border-slate-800 font-mono text-[9px]">
                      <button
                        type="button"
                        onClick={() => setThumbnailLayout('1row')}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          thumbnailLayout === '1row' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        1줄
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailLayout('3row')}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          thumbnailLayout === '3row' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        3줄
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailLayout('5row')}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          thumbnailLayout === '5row' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        5줄
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailLayout('10row')}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          thumbnailLayout === '10row' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        10줄
                      </button>
                    </div>
                  </div>

                  {/* [요청 8.4] 썸네일 가로/크기 배율 조절 */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">크기:</span>
                    <div className="flex rounded-md bg-slate-950 p-0.5 border border-slate-800 font-mono text-[9px]">
                      <button
                        type="button"
                        onClick={() => setThumbnailScale('sm')}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          thumbnailScale === 'sm' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        작게
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailScale('md')}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          thumbnailScale === 'md' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        보통
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailScale('lg')}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          thumbnailScale === 'lg' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        크게
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* [요청 8.1] 썸네일 이미지 고정비율로 생성 (보기 줄수에 따른 왜곡 없음: aspect-[3/4]) */}
              <div
                className={`p-2 rounded-lg bg-slate-950 border border-slate-800/80 scrollbar-thin ${
                  thumbnailLayout === '1row'
                    ? 'flex gap-2.5 overflow-x-auto pb-2'
                    : thumbnailLayout === '3row'
                    ? thumbnailScale === 'sm'
                      ? 'grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-52 overflow-y-auto'
                      : thumbnailScale === 'lg'
                      ? 'grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto'
                      : 'grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto'
                    : thumbnailLayout === '5row'
                    ? thumbnailScale === 'sm'
                      ? 'grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-64 overflow-y-auto'
                      : thumbnailScale === 'lg'
                      ? 'grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto'
                      : 'grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto'
                    : thumbnailScale === 'sm'
                    ? 'grid grid-cols-8 sm:grid-cols-12 gap-1 max-h-80 overflow-y-auto'
                    : thumbnailScale === 'lg'
                    ? 'grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-96 overflow-y-auto'
                    : 'grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-80 overflow-y-auto'
                }`}
              >
                {imageThumbnails.map((src, idx) => {
                  const isChecked = selectedThumbnails.includes(idx);
                  const oneRowWidth =
                    thumbnailScale === 'sm' ? '68px' : thumbnailScale === 'lg' ? '110px' : '88px';
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleSelectThumbnail(idx)}
                      className={`relative rounded-xl border bg-slate-900 shrink-0 overflow-hidden shadow-sm cursor-pointer transition-all aspect-[3/4] flex flex-col justify-between ${
                        isChecked ? 'border-sky-400 ring-2 ring-sky-500/40' : 'border-slate-700/80 hover:border-slate-500'
                      }`}
                      style={{
                        width: thumbnailLayout === '1row' ? oneRowWidth : 'auto',
                      }}
                    >
                      <img src={src} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />

                      {/* 페이지 번호 뱃지 */}
                      <span className="absolute bottom-1 left-1 bg-black/80 text-white font-mono text-[8px] px-1 rounded">
                        #{idx + 1}
                      </span>

                      {/* [요청 8.2] 이미지 우상단 체크박스 표시 */}
                      <div
                        className="absolute top-1 right-1 p-0.5 bg-black/70 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectThumbnail(idx)}
                          className="w-3.5 h-3.5 rounded border-slate-600 text-sky-500 focus:ring-sky-500 bg-slate-900 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 도서 표지명 및 소속 카테고리 */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">생성할 PDF 도서명</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="예: 바이브 코딩: 프로덕션의 원칙"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pr-7 text-white text-xs"
                  />
                  {uploadTitle && (
                    <button
                      type="button"
                      onClick={() => setUploadTitle('')}
                      className="absolute right-2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">소속 카테고리</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                >
                  {categories
                    .filter((c) => !c.isShared)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {getNodeFullPath(c.id)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImageToPdfModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs cursor-pointer"
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => setIsImageEditLayerOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/50 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="자르기/표준화 정밀 편집레이어 열기"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>⚙️ 옵션처리 (자르기/표준화)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleApplyImageEditSettings(
                    {
                      enabled: false,
                      mode: 'crop',
                      topPx: 0,
                      bottomPx: 0,
                      leftPx: 0,
                      rightPx: 0,
                      cropType: 'crop',
                      targetScope: 'all',
                    },
                    {
                      enabled: false,
                      pageSize: 'A4- 세로방향',
                      widthMm: 210,
                      heightMm: 297,
                      dpi: 300,
                      bgColor: '#ffffff',
                      alignHorizontal: 'center',
                      alignVertical: 'center',
                      fitMode: 'contain',
                    }
                  );
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
              >
                즉시 PDF 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 업로드 편집레이어 팝업 */}
      <ImageEditLayerModal
        isOpen={isImageEditLayerOpen}
        onClose={() => setIsImageEditLayerOpen(false)}
        onApply={handleApplyImageEditSettings}
        totalPages={504}
      />

      {/* 4종 다운로드 모달 */}
      {activeDownloadDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Download className="w-4 h-4 text-sky-400" />
                <span>4종 패키지 다운로드</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveDownloadDoc(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 font-semibold line-clamp-1">
              {activeDownloadDoc.title}
            </div>

            <div className="space-y-2">
              {[
                { title: '1. 원본 PDF 다운로드', desc: '순수 원본 문서 파일 (.pdf)' },
                { title: '2. 주석 포함 PDF 다운로드', desc: '하이라이트, 메모, 텍스트 주석 번들' },
                { title: '3. 최종 완성본 다운로드', desc: '주석 병합 및 인쇄 최적화본' },
                { title: '4. 보안 암호화 ZIP 압축본', desc: 'AES-256 암호화 및 무결성 체크섬' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    showCatNotice(`📥 ${item.title} 다운로드가 시작되었습니다.`);
                    setActiveDownloadDoc(null);
                  }}
                  className="w-full p-2.5 bg-slate-900 hover:bg-sky-600 hover:text-white border border-slate-800 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="font-bold text-slate-200 group-hover:text-white text-xs">{item.title}</div>
                  <div className="text-[10px] text-slate-500 group-hover:text-sky-100">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
