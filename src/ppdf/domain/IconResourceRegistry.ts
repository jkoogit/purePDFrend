export interface IconResourceItem {
  resourceKey: string;
  toolId: string;
  label: string;
  symbol: string;
  style: 'classic' | 'modern' | 'minimal' | 'bold';
}

export const TOOL_ICON_RESOURCES: IconResourceItem[] = [
  // 펜 그리기
  { resourceKey: 'res_pen_pencil', toolId: 'pen', label: '클래식 연필 (Pencil)', symbol: '✏️', style: 'classic' },
  { resourceKey: 'res_pen_nib', toolId: 'pen', label: '고급 만년필 (Fountain Nib)', symbol: '✒️', style: 'modern' },
  { resourceKey: 'res_pen_ballpoint', toolId: 'pen', label: '슬림 볼펜 (Ballpoint)', symbol: '🖊️', style: 'minimal' },
  { resourceKey: 'res_pen_feather', toolId: 'pen', label: '앤틱 깃털펜 (Quill)', symbol: '🪶', style: 'classic' },

  // 형광펜
  { resourceKey: 'res_highlight_crayon', toolId: 'highlight', label: '네온 크레용 (Crayon)', symbol: '🖍️', style: 'classic' },
  { resourceKey: 'res_highlight_marker', toolId: 'highlight', label: '와이드 마커 (Wide Marker)', symbol: '🖊️', style: 'modern' },
  { resourceKey: 'res_highlight_spark', toolId: 'highlight', label: '스파크 강조 (Sparkle)', symbol: '✨', style: 'bold' },

  // 붓 (브러시)
  { resourceKey: 'res_brush_art', toolId: 'brush', label: '아티스트 붓 (Paintbrush)', symbol: '🖌️', style: 'classic' },
  { resourceKey: 'res_brush_palette', toolId: 'brush', label: '물감 팔레트 (Palette)', symbol: '🎨', style: 'bold' },

  // 밑줄 및 취소선
  { resourceKey: 'res_underline_minus', toolId: 'underline', label: '심플 바 (Underline Bar)', symbol: '➖', style: 'minimal' },
  { resourceKey: 'res_underline_dash', toolId: 'underline', label: '점선 가이드 (Dashed)', symbol: '〰️', style: 'modern' },
  { resourceKey: 'res_strike_cross', toolId: 'strike', label: '레드 크로스 (Red Cross)', symbol: '❌', style: 'bold' },
  { resourceKey: 'res_strike_ban', toolId: 'strike', label: '금지 차단선 (Ban Slash)', symbol: '🚫', style: 'modern' },

  // 텍스트 상자 및 댓글
  { resourceKey: 'res_text_balloon', toolId: 'textbox', label: '대화 말풍선 (Speech Bubble)', symbol: '💬', style: 'classic' },
  { resourceKey: 'res_text_font', toolId: 'textbox', label: '타이포그래피 문자 (Font)', symbol: '🔤', style: 'minimal' },
  { resourceKey: 'res_comment_thought', toolId: 'comment', label: '사색 구름 (Thought Bubble)', symbol: '💭', style: 'modern' },
  { resourceKey: 'res_comment_chat', toolId: 'comment', label: '인출형 코멘트 (Chat Note)', symbol: '🗨️', style: 'classic' },

  // 지우개
  { resourceKey: 'res_eraser_broom', toolId: 'eraser', label: '클린 빗자루 (Broom)', symbol: '🧹', style: 'classic' },
  { resourceKey: 'res_eraser_sponge', toolId: 'eraser', label: '흡수 스펀지 (Sponge)', symbol: '🧽', style: 'modern' },
  { resourceKey: 'res_eraser_trash', toolId: 'eraser', label: '선택 파쇄기 (Shredder)', symbol: '🗑️', style: 'bold' },

  // 도형: 직사각형
  { resourceKey: 'res_rect_outline', toolId: 'rect', label: '외곽선 사각 (Box Outline)', symbol: '▭', style: 'minimal' },
  { resourceKey: 'res_rect_solid', toolId: 'rect', label: '면 채움 사각 (Filled Square)', symbol: '⬛', style: 'bold' },
  { resourceKey: 'res_rect_frame', toolId: 'rect', label: '포토 액자 프레임 (Frame)', symbol: '🖼️', style: 'classic' },

  // 도형: 원형 및 화살표
  { resourceKey: 'res_circle_outline', toolId: 'circle', label: '외곽선 원 (Circle Outline)', symbol: '◯', style: 'minimal' },
  { resourceKey: 'res_circle_target', toolId: 'circle', label: '포커스 타겟 (Bullseye Target)', symbol: '🎯', style: 'bold' },
  { resourceKey: 'res_circle_halo', toolId: 'circle', label: '라디오 버튼 원 (Radio Disc)', symbol: '🔘', style: 'modern' },
  { resourceKey: 'res_arrow_right', toolId: 'arrow', label: '지시 화살표 (Arrow Right)', symbol: '➔', style: 'classic' },
  { resourceKey: 'res_arrow_vector', toolId: 'arrow', label: '방위 나침반 (Compass Arrow)', symbol: '🧭', style: 'modern' },

  // 작성 및 서명
  { resourceKey: 'res_sign_fountain', toolId: 'sign_pad', label: '전자 서명 펜 (Signature Nib)', symbol: '🖋️', style: 'modern' },
  { resourceKey: 'res_sign_writing', toolId: 'sign_pad', label: '친필 서명 핸드 (Handwriting)', symbol: '✍️', style: 'classic' },
  { resourceKey: 'res_stamp_approved', toolId: 'stamp_approved', label: '국화 승인 인장 (Emblem Seal)', symbol: '💮', style: 'classic' },
  { resourceKey: 'res_stamp_badge', toolId: 'stamp_approved', label: '인증 뱃지 (Official Badge)', symbol: '🏵️', style: 'bold' },
  { resourceKey: 'res_stamp_calendar', toolId: 'stamp_date', label: '캘린더 날짜 (Calendar Date)', symbol: '📅', style: 'minimal' },

  // 보기 및 탐색
  { resourceKey: 'res_hand_open', toolId: 'hand', label: '오픈 핸드 (Open Hand)', symbol: '✋', style: 'classic' },
  { resourceKey: 'res_hand_grab', toolId: 'hand', label: '그랩 핸드 (Grab Hand)', symbol: '✊', style: 'modern' },
  { resourceKey: 'res_select_cursor', toolId: 'select_text', label: '텍스트 I-Beam 커서 (Text Beam)', symbol: '🔤', style: 'minimal' },
  { resourceKey: 'res_select_pointer', toolId: 'select_text', label: '터치 포인터 (Finger Point)', symbol: '👆', style: 'modern' },
];

export class IconResourceRegistry {
  private static resourceMap: Map<string, IconResourceItem> = new Map();

  static {
    TOOL_ICON_RESOURCES.forEach((r) => {
      IconResourceRegistry.resourceMap.set(r.resourceKey, r);
    });
  }

  public static getSymbol(resourceKey?: string, fallback: string = '📌'): string {
    if (!resourceKey) return fallback;
    const item = IconResourceRegistry.resourceMap.get(resourceKey);
    return item ? item.symbol : fallback;
  }

  public static getResource(resourceKey: string): IconResourceItem | undefined {
    return IconResourceRegistry.resourceMap.get(resourceKey);
  }

  public static getResourcesForTool(toolId: string): IconResourceItem[] {
    return TOOL_ICON_RESOURCES.filter((r) => r.toolId === toolId);
  }

  public static getAllResources(): IconResourceItem[] {
    return [...TOOL_ICON_RESOURCES];
  }
}
