import { Body, Controller, ForbiddenException, Get, Param, ParseEnumPipe, Post, Query, Req, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/infrastructure/decorators/auth.decorator.js';
import { GetPromotionHistoryUseCase, GetPromotionQuickHistoryUseCase, RedeemPromotionUseCase } from '../application/promotion.use-cases.js';
import { PromotionType } from '../domain/promotion-type.js';
import { PromotionAccountResDto, PromotionHistoryQueryDto, PromotionHistoryResDto, PromotionRedemptionResDto, RedeemPromotionDto } from './promotion.dto.js';
import { PromotionResponseMapper } from './promotion-response.mapper.js';

type AuthenticatedRequest = { user: { sub: string } };

@ApiTags('promotions')
@ApiBearerAuth('access-token')
@Auth()
@Controller()
export class PromotionsController {
  constructor(
    private readonly getHistory: GetPromotionHistoryUseCase,
    private readonly getHistoryQuick: GetPromotionQuickHistoryUseCase,
    private readonly redeemPromotion: RedeemPromotionUseCase,
  ) {}

  @Get('users/me/promotions/details')
  @ApiOkResponse({ type: PromotionHistoryResDto })
  async history(
    @Req() request: AuthenticatedRequest, 
    @Query(new ValidationPipe({ transform: true })) query: PromotionHistoryQueryDto)
  : Promise<PromotionHistoryResDto> {

    return PromotionResponseMapper.history(await this.getHistory.execute(request.user.sub, query.limit));
  }

  @Get('users/me/promotions')
  @ApiOkResponse({ type: Array<PromotionAccountResDto> })
  async quickHistory(
    @Req() request: AuthenticatedRequest, 
    @Query(new ValidationPipe({ transform: true })) query: PromotionHistoryQueryDto)
  : Promise<PromotionAccountResDto[]> {
    return await this.getHistoryQuick.execute(request.user.sub);
  }

  @Post('admin/promotions/:promotion/redemptions')
  @ApiCreatedResponse({ type: PromotionRedemptionResDto })
  async redeem(
    @Param('promotion', new ParseEnumPipe(PromotionType)) promotion: PromotionType,
    @Req() request: AuthenticatedRequest,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: RedeemPromotionDto,
  ): Promise<PromotionRedemptionResDto> {
    return PromotionResponseMapper.redemption(await this.redeemPromotion.execute({
      ...body, promotion, operatorId: request.user.sub,
    }));
  }

  @Get('admin/:userId/promotions')
  @ApiOkResponse({ type: PromotionHistoryResDto })
  async adminCheckHistoryUser(
    @Param('userId') userId: string,
    @Req() request: AuthenticatedRequest, 
    @Query(new ValidationPipe({ transform: true })) query: PromotionHistoryQueryDto)
  : Promise<PromotionHistoryResDto> {
    if (!request.user.sub || request.user.sub !== process.env.ADMIN_ID) {
      throw new ForbiddenException('Admin authorization required');
    }
    return PromotionResponseMapper.history(await this.getHistory.execute(userId, query.limit));
  }
}