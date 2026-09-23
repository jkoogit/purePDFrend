export type VendorOriginType = 'AI_COLLECTED' | 'SYSTEM_CONFIRMED';
export type VendorStatus = 'ACTIVE' | 'STAGING' | 'DEPRECATED';

export interface VendorQuotaRule {
  maxTpm: number;
  maxRpm: number;
  maxRpd: number; // 일일 요청 한도 (예: Pro 250, Flash 2500)
  resetHourKst: number; // 기본 16:00 KST
}

export interface VendorSubscriptionPlan {
  planId: string;
  planName: string;
  billingType: 'FREE' | 'SUBSCRIPTION' | 'USAGE_BASED';
  allowedModels: string[];
  quotaLimits: VendorQuotaRule;
  description?: string;
}

export interface VendorAgentEngine {
  agentId: string;
  agentName: string;
  targetTier: 'TIER_1_PRO' | 'TIER_2_FLASH' | 'TIER_3_LITE';
  defaultModel: string;
  description?: string;
}

export class VendorAttribute {
  constructor(
    public readonly vendorId: string, // GOOGLE, ANTHROPIC, OPENAI
    public vendorName: string,
    public originType: VendorOriginType, // AI_COLLECTED vs SYSTEM_CONFIRMED
    public status: VendorStatus,
    public subscriptionPlans: VendorSubscriptionPlan[] = [],
    public agentEngines: VendorAgentEngine[] = [],
    public metadata: Record<string, unknown> = {},
    public updatedAt: string = new Date().toISOString()
  ) {}

  public static createDefaultGoogleVendor(): VendorAttribute {
    return new VendorAttribute(
      'GOOGLE',
      'Google Cloud / AI Studio',
      'SYSTEM_CONFIRMED',
      'ACTIVE',
      [
        {
          planId: 'PLAN-GOOGLE-ADVANCED',
          planName: 'Google AI Pro (구독)',
          billingType: 'SUBSCRIPTION',
          allowedModels: [
            'models/gemini-1.5-pro',
            'models/gemini-1.5-flash',
            'models/gemini-1.5-flash-8b',
            'models/gemini-3.8-flash'
          ],
          quotaLimits: {
            maxTpm: 4000000,
            maxRpm: 360,
            maxRpd: 250, // Pro 250회/일
            resetHourKst: 16
          },
          description: 'Tier 1 Pro 일 250회 및 Flash 2500회 제공'
        },
        {
          planId: 'PLAN-GOOGLE-STANDARD',
          planName: 'Google AI Flash (표준)',
          billingType: 'FREE',
          allowedModels: [
            'models/gemini-1.5-flash',
            'models/gemini-1.5-flash-8b',
            'models/gemini-3.8-flash'
          ],
          quotaLimits: {
            maxTpm: 1000000,
            maxRpm: 120,
            maxRpd: 2500,
            resetHourKst: 16
          },
          description: 'Flash 중심 표준 개발 플랜'
        }
      ],
      [
        {
          agentId: 'agent-architect',
          agentName: '아키텍처 및 기획 에이전트',
          targetTier: 'TIER_1_PRO',
          defaultModel: 'models/gemini-1.5-pro',
          description: '요구사항 심층 분석 및 DDD 헥사고날 아키텍처 수립'
        },
        {
          agentId: 'agent-coder',
          agentName: '구현 및 TDD 에이전트',
          targetTier: 'TIER_2_FLASH',
          defaultModel: 'models/gemini-1.5-flash',
          description: '컴포넌트/서비스 개발 및 단위 테스트 수행'
        },
        {
          agentId: 'agent-devops',
          agentName: '정리 및 배포 에이전트',
          targetTier: 'TIER_3_LITE',
          defaultModel: 'models/gemini-1.5-flash-8b',
          description: '문서 동기화, 하네스 정리 및 Git 승급'
        }
      ]
    );
  }
}
