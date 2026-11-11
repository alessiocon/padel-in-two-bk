import { Module } from '@nestjs/common';
import { ClubsModule } from '../clubs/clubs.module.js';
import { ICLUB_PRICING_RULE_REPOSITORY } from './infrastructure/pricing-rule.repository.js';
import { PrismaPricingRuleRepository } from './infrastructure/prisma-pricing-rule.repository.js';
import { PricingRulesController } from './presentation/pricing-rules.controller.js';
import { PRICEROLE_USE_CASES } from './application/pricing-rule.use-cases.js';

@Module({
  imports: [ClubsModule],
  controllers: [PricingRulesController],
  providers: [
    PrismaPricingRuleRepository,
    { provide: ICLUB_PRICING_RULE_REPOSITORY, useExisting: PrismaPricingRuleRepository },
    ...PRICEROLE_USE_CASES
  ],
  exports: [ICLUB_PRICING_RULE_REPOSITORY, PrismaPricingRuleRepository],
})
export class ClubPricingModule {}