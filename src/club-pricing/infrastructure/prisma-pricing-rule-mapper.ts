import {
  Prisma,
  ClubPricingRule as PrismaPricingRule,
  ClubPricingRulePriceMode as PrismaPricingRulePriceMode,
  ClubPricingRuleScope as PrismaPricingRuleScope,
} from '@prisma/client';
import {
  PricingRule,
  PricingRulePriceMode,
  PricingRuleScope,
} from '../domain/pricing-rule.entity.js';

export const pricingRuleWithCourtLinks = Prisma.validator<Prisma.ClubPricingRuleDefaultArgs>()({
  include: {
    courtLinks: {
      select: { courtId: true },
    },
  },
});

export type PrismaPricingRuleWithCourtLinks = Prisma.ClubPricingRuleGetPayload<
  typeof pricingRuleWithCourtLinks
>;

export class PrismaPricingRuleMapper {
  public static readonly PRISMA_TO_DOMAIN_PRICE_MODE: Record<PrismaPricingRulePriceMode, PricingRulePriceMode> = {
    [PrismaPricingRulePriceMode.MULTIPLIER]: PricingRulePriceMode.MULTIPLIER,
    [PrismaPricingRulePriceMode.FIXED_SLOT_PRICE]: PricingRulePriceMode.FIXED_SLOT_PRICE,
  };

  public static readonly DOMAIN_TO_PRISMA_PRICE_MODE: Record<PricingRulePriceMode, PrismaPricingRulePriceMode> = {
    [PricingRulePriceMode.MULTIPLIER]: PrismaPricingRulePriceMode.MULTIPLIER,
    [PricingRulePriceMode.FIXED_SLOT_PRICE]: PrismaPricingRulePriceMode.FIXED_SLOT_PRICE,
  };

  public static readonly PRISMA_TO_DOMAIN_SCOPE: Record<PrismaPricingRuleScope, PricingRuleScope> = {
    [PrismaPricingRuleScope.ALL_COURTS]: PricingRuleScope.ALL_COURTS,
    [PrismaPricingRuleScope.SELECTED_COURTS]: PricingRuleScope.SELECTED_COURTS,
  };

  public static readonly DOMAIN_TO_PRISMA_SCOPE: Record<PricingRuleScope, PrismaPricingRuleScope> = {
    [PricingRuleScope.ALL_COURTS]: PrismaPricingRuleScope.ALL_COURTS,
    [PricingRuleScope.SELECTED_COURTS]: PrismaPricingRuleScope.SELECTED_COURTS,
  };

  static toDomain(record: PrismaPricingRuleWithCourtLinks): PricingRule {
    return PricingRule.reconstitute({
      id: record.id,
      clubId: record.clubId,
      name: record.name,
      scope: this.PRISMA_TO_DOMAIN_SCOPE[record.scope],
      courtIds: record.courtLinks.map(link => link.courtId),
      weekdays: record.weekdays,
      startTime: record.startTime,
      endTime: record.endTime,
      validFrom: record.validFrom,
      validUntil: record.validUntil,
      priceMode: this.PRISMA_TO_DOMAIN_PRICE_MODE[record.priceMode],
      value: record.value.toNumber(),
      priority: record.priority,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(rule: PricingRule): Prisma.ClubPricingRuleUncheckedCreateInput {
    const props = rule.toPrimitives();
    return {
      id: props.id,
      clubId: props.clubId,
      name: props.name,
      scope: this.DOMAIN_TO_PRISMA_SCOPE[props.scope],
      weekdays: props.weekdays,
      startTime: props.startTime,
      endTime: props.endTime,
      validFrom: props.validFrom,
      validUntil: props.validUntil,
      priceMode: this.DOMAIN_TO_PRISMA_PRICE_MODE[props.priceMode],
      value: new Prisma.Decimal(props.value),
      priority: props.priority,
      isActive: props.isActive,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}