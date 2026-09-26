/**
 * Factory Pattern: PdfSecurityStrategyFactory
 * Provides registration and lookup of situational PDF security strategies
 */

import { IPdfSecurityStrategy } from '../strategies/IPdfSecurityStrategy';
import { NoSecurityStrategy } from '../strategies/NoSecurityStrategy';
import { ReadOnlyDistributionStrategy } from '../strategies/ReadOnlyDistributionStrategy';
import { HighConfidentialEnterpriseStrategy } from '../strategies/HighConfidentialEnterpriseStrategy';
import { StrictDRMProtectionStrategy } from '../strategies/StrictDRMProtectionStrategy';
import { CustomConfigurableSecurityStrategy } from '../strategies/CustomConfigurableSecurityStrategy';
import { PdfSecurityProfileType } from '../models/PdfSecurityPolicy';

export class PdfSecurityStrategyFactory {
  private static readonly strategies = new Map<string, IPdfSecurityStrategy>();

  static {
    // Register standard out-of-the-box strategies
    this.registerStrategy('NONE', new NoSecurityStrategy());
    this.registerStrategy('READ_ONLY_DIST', new ReadOnlyDistributionStrategy());
    this.registerStrategy('READ_ONLY', new ReadOnlyDistributionStrategy());
    this.registerStrategy('ENTERPRISE_CONFIDENTIAL', new HighConfidentialEnterpriseStrategy());
    this.registerStrategy('ENTERPRISE', new HighConfidentialEnterpriseStrategy());
    this.registerStrategy('STRICT_DRM', new StrictDRMProtectionStrategy());
    this.registerStrategy('CUSTOM', new CustomConfigurableSecurityStrategy());
  }

  /**
   * Register a new or custom security strategy (Open-Closed Principle)
   */
  public static registerStrategy(type: string, strategy: IPdfSecurityStrategy): void {
    this.strategies.set(type.toUpperCase(), strategy);
  }

  /**
   * Resolves strategy by profile type
   */
  public static getStrategy(type: PdfSecurityProfileType | string): IPdfSecurityStrategy {
    const key = type.toUpperCase();
    const strategy = this.strategies.get(key);
    if (!strategy) {
      throw new Error(`등록되지 않은 PDF 보안 전략 프로필입니다: "${type}". 사용 가능한 프로필: ${Array.from(this.strategies.keys()).join(', ')}`);
    }
    return strategy;
  }

  /**
   * Alias for getStrategy
   */
  public static createStrategy(type: PdfSecurityProfileType | string): IPdfSecurityStrategy {
    return this.getStrategy(type);
  }

  /**
   * Lists all available registered strategies with descriptions
   */
  public static listAvailableStrategies(): Array<{ type: string; name: string; description: string }> {
    return Array.from(this.strategies.entries()).map(([type, strategy]) => ({
      type,
      name: strategy.displayName,
      description: strategy.description,
    }));
  }
}
