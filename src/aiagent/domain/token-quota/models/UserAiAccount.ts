export interface AccountTierOverride {
  tier1Model?: string; // 지정 시 사용자 글로벌 선호 대신 우선 적용
  tier2Model?: string;
  tier3Model?: string;
}

export class UserAiAccount {
  constructor(
    public readonly accountId: string, // ACC-GEMINI-PERSONAL-01
    public readonly userId: string, // USR-DEV-001
    public readonly vendorId: string, // GOOGLE, ANTHROPIC, OPENAI
    public accountEmail: string, // user.personal@gmail.com
    public accountLabel: string, // 개인 Google One AI 계정
    public planId: string, // PLAN-GOOGLE-ADVANCED
    public isDefault: boolean = false,
    public tierOverride?: AccountTierOverride,
    public statusCd: 'ACTIVE' | 'FROZEN' | 'EXPIRED' = 'ACTIVE',
    public createdAt: string = new Date().toISOString(),
    public updatedAt: string = new Date().toISOString()
  ) {}

  public static createDefaultUserAccounts(userId: string, email: string): UserAiAccount[] {
    return [
      new UserAiAccount(
        `ACC-${userId}-GOOGLE-PRO`,
        userId,
        'GOOGLE',
        email,
        '메인 Gemini Pro 계정 (개인)',
        'PLAN-GOOGLE-ADVANCED',
        true, // default
        {
          tier1Model: 'models/gemini-1.5-pro',
          tier2Model: 'models/gemini-1.5-flash',
          tier3Model: 'models/gemini-1.5-flash-8b'
        }
      ),
      new UserAiAccount(
        `ACC-${userId}-GOOGLE-SUB`,
        userId,
        'GOOGLE',
        `sub.${email}`,
        '보조 Gemini Flash 계정 (공용)',
        'PLAN-GOOGLE-STANDARD',
        false,
        {
          tier1Model: 'models/gemini-1.5-flash',
          tier2Model: 'models/gemini-1.5-flash',
          tier3Model: 'models/gemini-1.5-flash-8b'
        }
      )
    ];
  }
}
