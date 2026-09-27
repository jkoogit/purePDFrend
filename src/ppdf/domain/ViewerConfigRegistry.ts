import defaultViewerData from '../../../data/default_viewer_shortcuts_tools.json';
import { IconResourceRegistry } from './IconResourceRegistry';

export interface ToolItem {
  id: string;
  name: string;
  icon: string;
  defaultKey: string;
  category: string;
  desc: string;
  iconResource?: string;
}

export interface ViewerConfigState {
  version: string;
  updatedAt: string;
  shortcuts: Record<string, string>; // toolId -> shortcut string
  groups: Record<string, string[]>; // groupId -> toolId[] (그룹 간 중복 허용)
  toolIcons: Record<string, string>; // toolId -> resourceKey
}

const STORAGE_KEY = 'purepdf_user_viewer_config_v1';

export class ViewerConfigRegistry {
  private static instance: ViewerConfigRegistry;
  private currentConfig: ViewerConfigState;
  private toolRegistry: Map<string, ToolItem> = new Map();

  private constructor() {
    // 1. 도구 레지스트리 인메모리 맵 색인
    defaultViewerData.toolRegistry.forEach((t) => {
      this.toolRegistry.set(t.id, t);
    });

    // 2. 사용자 설정 로드 또는 기본값 초기화
    this.currentConfig = this.loadConfig();
  }

  public static getInstance(): ViewerConfigRegistry {
    if (!ViewerConfigRegistry.instance) {
      ViewerConfigRegistry.instance = new ViewerConfigRegistry();
    }
    return ViewerConfigRegistry.instance;
  }

  /**
   * 기본 JSON 구조로부터 초기 설정 생성
   */
  public getDefaultConfig(): ViewerConfigState {
    const shortcuts: Record<string, string> = {};
    const toolIcons: Record<string, string> = {};
    defaultViewerData.toolRegistry.forEach((t) => {
      shortcuts[t.id] = t.defaultKey;
    });

    return {
      version: defaultViewerData.version,
      updatedAt: defaultViewerData.updatedAt,
      shortcuts,
      groups: JSON.parse(JSON.stringify(defaultViewerData.defaultGroups)),
      toolIcons,
    };
  }

  /**
   * 로컬 스토리지 또는 JSON 기본값 로드
   */
  private loadConfig(): ViewerConfigState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.groups && parsed.shortcuts) {
          if (!parsed.toolIcons) parsed.toolIcons = {};
          return parsed;
        }
      }
    } catch {
      // IndexedDB / 로컬스토리지 접근 불가 시 안전 폴백
    }
    return this.getDefaultConfig();
  }

  /**
   * 현재 인메모리 설정값 조회
   */
  public getConfig(): ViewerConfigState {
    return { ...this.currentConfig };
  }

  /**
   * 도구의 현재 활성 아이콘 심볼 조회 (리소스 이름 우선)
   */
  public getEffectiveIcon(toolId: string): string {
    const resKey = this.currentConfig.toolIcons?.[toolId];
    if (resKey) {
      const symbol = IconResourceRegistry.getSymbol(resKey);
      if (symbol) return symbol;
    }
    const tool = this.toolRegistry.get(toolId);
    return tool ? tool.icon : '📌';
  }

  /**
   * 전체 도구 레지스트리 반환 (현재 적용된 아이콘 반영)
   */
  public getAllTools(): ToolItem[] {
    return Array.from(this.toolRegistry.values()).map((t) => ({
      ...t,
      icon: this.getEffectiveIcon(t.id),
      iconResource: this.currentConfig.toolIcons?.[t.id],
    }));
  }

  /**
   * 단일 도구 메타데이터 조회
   */
  public getTool(toolId: string): ToolItem | undefined {
    const tool = this.toolRegistry.get(toolId);
    if (!tool) return undefined;
    return {
      ...tool,
      icon: this.getEffectiveIcon(tool.id),
      iconResource: this.currentConfig.toolIcons?.[tool.id],
    };
  }

  /**
   * 특정 그룹의 도구 목록 조회 (중복 포함, 적용된 아이콘 반영)
   */
  public getToolsForGroup(groupId: string): ToolItem[] {
    const toolIds = this.currentConfig.groups[groupId] || [];
    return toolIds
      .map((id) => this.getTool(id))
      .filter((t): t is ToolItem => Boolean(t));
  }

  /**
   * 도구의 아이콘 리소스 변경
   */
  public updateToolIcon(toolId: string, resourceKey: string): ViewerConfigState {
    if (!this.currentConfig.toolIcons) {
      this.currentConfig.toolIcons = {};
    }
    this.currentConfig.toolIcons[toolId] = resourceKey;
    this.currentConfig.updatedAt = new Date().toISOString();
    this.persist();
    return this.getConfig();
  }

  /**
   * 그룹에 도구 추가 (그룹 간 '중복' 허용)
   */
  public addToolToGroup(groupId: string, toolId: string): ViewerConfigState {
    if (!this.toolRegistry.has(toolId)) return this.currentConfig;
    if (!this.currentConfig.groups[groupId]) {
      this.currentConfig.groups[groupId] = [];
    }

    this.currentConfig.groups[groupId].push(toolId);
    this.currentConfig.updatedAt = new Date().toISOString();
    this.persist();
    return this.getConfig();
  }

  /**
   * 그룹에서 특정 인덱스의 도구 제거
   */
  public removeToolFromGroup(groupId: string, index: number): ViewerConfigState {
    if (this.currentConfig.groups[groupId]) {
      this.currentConfig.groups[groupId].splice(index, 1);
      this.currentConfig.updatedAt = new Date().toISOString();
      this.persist();
    }
    return this.getConfig();
  }

  /**
   * 그룹 내 도구 순서 변경 (드래그 앤 드롭 재정렬)
   */
  public reorderTools(groupId: string, fromIndex: number, toIndex: number): ViewerConfigState {
    const list = this.currentConfig.groups[groupId];
    if (list && fromIndex >= 0 && fromIndex < list.length && toIndex >= 0 && toIndex < list.length) {
      const [item] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, item);
      this.currentConfig.updatedAt = new Date().toISOString();
      this.persist();
    }
    return this.getConfig();
  }

  /**
   * 단축키 수정 (PC/태블릿 키보드 바인딩)
   */
  public updateShortcut(toolId: string, newKey: string): ViewerConfigState {
    this.currentConfig.shortcuts[toolId] = newKey.trim();
    this.currentConfig.updatedAt = new Date().toISOString();
    this.persist();
    return this.getConfig();
  }

  /**
   * 기본 JSON 설정으로 전체 초기화 (Reset)
   */
  public resetToDefault(): ViewerConfigState {
    this.currentConfig = this.getDefaultConfig();
    this.persist();
    return this.getConfig();
  }

  /**
   * 로컬 스토리지에 영속화
   */
  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentConfig));
    } catch {
      // ignore in SSR or blocked env
    }
  }
}
