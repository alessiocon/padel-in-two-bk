import type { PricingRule } from '../domain/pricing-rule.entity.js';

export const ICLUB_PRICING_RULE_REPOSITORY = Symbol('ICLUB_PRICING_RULE_REPOSITORY');

export interface IClubPricingRuleRepository {
  upsert(rule: PricingRule): Promise<PricingRule>;
  findById(id: string, clubId: string): Promise<PricingRule | null>;
  getAll(clubId: string): Promise<PricingRule[]>;
  delete(id: string, clubId: string): Promise<boolean>;
}