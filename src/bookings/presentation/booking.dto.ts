import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { BookingStatus } from '../domain/booking.js';
import { Optional } from '@nestjs/common';

export class CreateBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  courtId!: string;

  @ApiProperty({ 
    type: String, 
    description: 'Note aggiuntive o riferimenti per prenotazioni manuali',
    example: "prenotazione di Mario rossi 08111111111",
    required: false })
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ type: Number, description: 'Number of slots to book (1-2)' })
  @IsIn([1, 2])
  slots: number; // Optional array of slots, can be used for future extensions
}



export class UpdateBookingDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.RESERVED })
  @IsOptional()
  status: BookingStatus;
}



export class BookingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  clubId!: string;

  @ApiProperty({ format: 'uuid' })
  courtId!: string;

  @ApiProperty({ type: String })
  description?: string;

  @ApiProperty({ format: 'date-time' })
  startsAt!: Date;

  @ApiProperty({ format: 'date-time' })
  endsAt!: Date;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.RESERVED })
  status!: BookingStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
export class BookingResDto {
    id: string;
    courtId: string;
    status: BookingStatus;
    clubId: string;
    description: string;
    startsAt: string;
    endsAt: string;
}

export class BookingUserResDto {
    id: string;
    courtId: string;
    clubId: string;
    courtName: string;
    position: string;
    status: BookingStatus;
    description: string;
    startsAt: string;
    endsAt: string;
    isIndoor: boolean;
}
