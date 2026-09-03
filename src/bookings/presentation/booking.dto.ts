import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsUUID } from 'class-validator';
import type { BookingStatus } from '../domain/booking.js';

export class CreateBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  courtId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional({ enum: ['free', 'reserved', 'searching', 'blocked'], default: 'reserved' })
  @IsIn(['free', 'reserved', 'searching', 'blocked'])
  status?: BookingStatus;
}

export class BookingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  clubId!: string;

  @ApiProperty({ format: 'uuid' })
  courtId!: string;

  @ApiProperty({ format: 'date-time' })
  startsAt!: Date;

  @ApiProperty({ format: 'date-time' })
  endsAt!: Date;

  @ApiProperty({ enum: ['free', 'reserved', 'searching', 'blocked'] })
  status!: BookingStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
