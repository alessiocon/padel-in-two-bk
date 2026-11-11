import { Inject, Injectable } from "@nestjs/common";
import { ICLUB_PRICING_RULE_REPOSITORY, type IClubPricingRuleRepository } from "../infrastructure/pricing-rule.repository.js";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { PricingRule, PricingRuleProps } from "../domain/pricing-rule.entity.js";


type CreatePriceRoleInput = Omit<PricingRuleProps, 'createdAt' | 'id'| 'updatedAt'>


@Injectable()
export class CreatePricingRuleUseCase {
  constructor(
    @Inject(ICLUB_PRICING_RULE_REPOSITORY) private readonly repository: IClubPricingRuleRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  execute(input: CreatePriceRoleInput): Promise<PricingRule> {
    return this.repository.upsert(PricingRule.create({
        ...input,
        createdAt: this.clock.now(),
    }));
  }
}
