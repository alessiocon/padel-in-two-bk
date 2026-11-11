import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ClubRole } from '../../clubs/domain/entity/club.member.entity.js';
import { GetClubStaffUseCase } from '../../clubs/application/club-use-cases.js';
import { Auth } from '../../auth/infrastructure/decorators/auth.decorator.js';
import { PricingRule } from '../domain/pricing-rule.entity.js';
import { CreatePricingRuleDto, PricingRuleResponseDto, UpdatePricingRuleDto } from './pricing-rule.dto.js';
import { CreatePricingRuleUseCase } from '../application/create.praceRole.use-case.js';
import { UpdatePricingRuleUseCase } from '../application/update.priceRole.use-case.js';
import { DeletePricingRuleUseCase } from '../application/delete.priceRole.use-case.js';

type AuthenticatedRequest = { user: { sub: string } };

@ApiTags('club-pricing')
@ApiBearerAuth('access-token')
@Auth()
@Controller('clubs/:clubId/pricing-rules')
export class PricingRulesController {
  constructor(
    private readonly createPricingRule: CreatePricingRuleUseCase,
    private readonly updatePricingRule: UpdatePricingRuleUseCase,
    private readonly deletePricingRule: DeletePricingRuleUseCase,
    private readonly getClubStaff: GetClubStaffUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a club pricing rule' })
  @ApiCreatedResponse({ type: PricingRuleResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid pricing rule data' })
  async create(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: CreatePricingRuleDto,
  ): Promise<PricingRuleResponseDto> {
    try {
      await this.assertManager(clubId, request.user.sub);
      const rule = await this.createPricingRule.execute({
        clubId,
        ...body,
        courtIds: body.courtIds ?? [],
        weekdays: body.weekdays ?? [],
        validFrom: new Date(body.validFrom),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        priority: body.priority ?? 0,
        isActive: body.isActive ?? true,
      });

      return this.toResponse(rule);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Patch(':ruleId')
  @ApiOperation({ summary: 'Update a club pricing rule' })
  @ApiOkResponse({ type: PricingRuleResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid pricing rule data or UUID' })
  @ApiNotFoundResponse({ description: 'Pricing rule not found' })
  async update(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Param('ruleId', new ParseUUIDPipe()) ruleId: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdatePricingRuleDto,
  ): Promise<PricingRuleResponseDto> {
    try {
      await this.assertManager(clubId, request.user.sub);
      const rule = await this.updatePricingRule.execute({
        id: ruleId,
        clubId,
        changes: {
          name: body.name,
          scope: body.scope,
          courtIds: body.courtIds,
          weekdays: body.weekdays,
          startTime: body.startTime,
          endTime: body.endTime,
          validFrom: body.validFrom === undefined ? undefined : new Date(body.validFrom),
          validUntil: body.validUntil === undefined
            ? undefined
            : body.validUntil === null ? null : new Date(body.validUntil),
          priceMode: body.priceMode,
          value: body.value,
          priority: body.priority,
          isActive: body.isActive,
        },
      });

      return this.toResponse(rule);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a club pricing rule' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Pricing rule not found' })
  async remove(
    @Param('clubId', new ParseUUIDPipe()) clubId: string,
    @Param('ruleId', new ParseUUIDPipe()) ruleId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    try {
      await this.assertManager(clubId, request.user.sub);
      await this.deletePricingRule.execute(ruleId, clubId);
    } catch (error) {
      throw this.toHttpError(error);
    }
  }

  
  private async assertManager(clubId: string, userId: string): Promise<void> {
    const members = await this.getClubStaff.execute(clubId);
    const member = members.find(candidate => candidate.userId === userId);
    if (!member || (member.role !== ClubRole.OWNER && member.role !== ClubRole.MANAGER)) {
      throw new ForbiddenException('Only club owners and managers can manage pricing rules');
    }
  }

  private toResponse(rule: PricingRule): PricingRuleResponseDto {
    return Object.assign(new PricingRuleResponseDto(), rule.toPrimitives());
  }

  private toHttpError(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    if (error instanceof Error) {
      return new BadRequestException(error.message);
    }
    return new InternalServerErrorException('Unable to process pricing rule request');
  }
}