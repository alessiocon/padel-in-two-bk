import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';
import { CLUB_IREPOSITORY, type IClubRepository } from '../../clubs/infrastructure/club-IRepository.js';
import { ClubRole } from '../../clubs/domain/entity/club.member.entity.js';
import { type IPromotionRepository, PROMOTION_REPOSITORY } from '../domain/promotion.repository.js';
import { PromotionType } from '../domain/promotion-type.js';
import { ENV_CONFIG, type AppEnv } from '../../config/env.js';
import { PromotionRedemption } from '../domain/entity/promotion.redemption.entity.js';
import { PromotionAccount } from '@prisma/client';
import { PromotionResponseMapper } from '../presentation/promotion-response.mapper.js';
import { PromotionAccountResDto } from '../presentation/promotion.dto.js';

@Injectable()
export class GetPromotionHistoryUseCase {
  constructor(@Inject(PROMOTION_REPOSITORY) private readonly repository: IPromotionRepository) {}

  execute(userId: string, limit: number) { return this.repository.history(userId, limit); }
}

@Injectable()
export class GetPromotionQuickHistoryUseCase {
  constructor(@Inject(PROMOTION_REPOSITORY) private readonly repository: IPromotionRepository) {}

  async execute(userId: string) : Promise<PromotionAccountResDto[]> { 
    const accounts = await this.repository.quickHistory(userId); 
    return PromotionResponseMapper.domainToDto(accounts); 
  }
}

@Injectable()
export class SetClubPromotionsUseCase {
  constructor(
    @Inject(PROMOTION_REPOSITORY) private readonly repository: IPromotionRepository,
    @Inject(CLUB_IREPOSITORY) private readonly clubs: IClubRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(clubId: string, operatorId: string, promotions: PromotionType[]) {
    const club = await this.clubs.findById(clubId);
    if (!club) throw new NotFoundException('Club not found');
    const member = club.members.find(candidate => candidate.userId === operatorId);
    if (!member || ![ClubRole.OWNER, ClubRole.MANAGER].includes(member.role)) {
      throw new ForbiddenException('Only club owners and managers can manage promotions');
    }
    return this.repository.setClubPromotions(clubId, promotions, this.clock.now());
  }
}

@Injectable()
export class RedeemPromotionUseCase {
  constructor(
    @Inject(PROMOTION_REPOSITORY) private readonly repository: IPromotionRepository,
    @Inject(ENV_CONFIG) private readonly env: AppEnv,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(input: {
    requestId: string; userId: string; operatorId: string; promotion: PromotionType; points: number;
  }) {
    if (!this.env.adminId || input.operatorId !== this.env.adminId) {
      throw new ForbiddenException('Promotion administrator authorization required');
    }
    if (input.promotion !== PromotionType.ACCUMULATE_POINTS) {
      throw new BadRequestException('This promotion does not support point redemptions');
    }
    if (!Number.isSafeInteger(input.points) || input.points <= 0 || input.points > 2_147_483_647) {
      throw new BadRequestException('Points must be a positive 32-bit integer');
    }
    return this.repository.redeem(PromotionRedemption.create({
      id: input.requestId, userId: input.userId, clubId: null,
      redeemedById: input.operatorId, promotion: input.promotion,
      points: input.points, createdAt: this.clock.now(),
    }));
  }
}