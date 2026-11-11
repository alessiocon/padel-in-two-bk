import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionType } from '../domain/promotion-type.js';

export class SetClubPromotionsDto {
  @ApiProperty({ enum: PromotionType, isArray: true })
  @IsArray()
  @ArrayUnique()
  @IsEnum(PromotionType, { each: true })
  promotions!: PromotionType[];
}

export class RedeemPromotionDto {
  @ApiProperty({ format: 'uuid', description: 'Unique request ID reused for retries' })
  @IsUUID()
  requestId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ minimum: 1, maximum: 2147483647, example: 10 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  points!: number;
}

export class PromotionHistoryQueryDto {
  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;
}

export class PromotionAccountResDto {
  @ApiProperty({ enum: PromotionType }) promotion!: PromotionType;
  @ApiProperty() totalPoints!: number;
  @ApiProperty() availablePoints!: number;
  @ApiProperty() redeemedPoints!: number;
}

export class PromotionAwardResDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) bookingId!: string;
  @ApiProperty({ enum: PromotionType }) promotion!: PromotionType;
  @ApiProperty() points!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class PromotionRedemptionResDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true }) clubId!: string | null;
  @ApiProperty({ format: 'uuid' }) redeemedById!: string;
  @ApiProperty({ enum: PromotionType }) promotion!: PromotionType;
  @ApiProperty() points!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class PromotionHistoryResDto {
  @ApiProperty({ type: [PromotionAccountResDto] }) 
  accounts!: PromotionAccountResDto[];
  @ApiProperty({ type: [PromotionAwardResDto] }) 
  awards!: PromotionAwardResDto[];
  @ApiProperty({ type: [PromotionRedemptionResDto] }) 
  redemptions!: PromotionRedemptionResDto[];
}