import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { ClubStatus} from "../domain/club.aggregate.js"
import { CourtStatus} from "../domain/entity/court.entity.js"
import { ClubRole } from '../domain/entity/club.member.entity.js';
import { Type } from 'class-transformer';

export class CreateClubDto {
  @ApiProperty({ example: 'Padel Milano' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: 'info@padelmilano.it' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  ownerId!: string;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  courtInDoor: number = 0;

  @ApiPropertyOptional({ example: 0, default: 0, minimum: 0, maximum: 10})
  @IsOptional()
  @IsInt()
  courtOutDoor: number = 0;

  @ApiProperty({ example: 'Via dei mille, 22, Napoli' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  position: string;
  
  @ApiPropertyOptional({type: String, example: "Europe/Rome", default: "Europe/Rome" })
  @IsOptional()
  timezone: string

  @ApiPropertyOptional({ example: 43.20, default: 0, minimum: 0, maximum: 999})
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'il costo del campo deve essere un numero valido con massimo 2 cifre decimali' })
  @Min(0)
  @Max(999)
  slotPrice: number;

  @ApiPropertyOptional({ example: 2, default: 0, minimum: 0, maximum: 99})
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'il costo della pala deve essere un numero valido con massimo 2 cifre decimali' })
  @Min(0)
  @Max(99)
  racketPrice: number

  @ApiPropertyOptional({ example: 90, default: 90 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  slotDurationMinutes: number = 90;

  @ApiPropertyOptional({ example: '08:00', default: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'openingTime must be in HH:mm format',
  })
  openingTime: string = '08:00';

  @ApiPropertyOptional({ example: '23:00', default: '23:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'closingTime must be in HH:mm format',
  })
  closingTime: string = '23:00';
  

  @IsArray({ message: 'Members must be an array' })
  @ArrayNotEmpty({ message: 'At least one member must be provided' })
  @ValidateNested({ each: true }) // Dice a class-validator di validare ogni singolo oggetto dentro l'array
  @Type(() => ClubMembersCreateReqDto)
  members: ClubMembersCreateReqDto[]
}

export class ClubMembersCreateReqDto {
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  @IsNotEmpty({ message: 'Club role is required' })
  @IsEnum(ClubRole, { message: 'Invalid club role. Allowed values: OWNER, MANAGER, COACH, STAFF' })
  role: ClubRole;

  @IsArray({ message: 'Permissions must be an array' })
  @IsString({ each: true, message: 'Each permission must be a valid string' })
  @IsOptional()
  permissions: string[]
}

export class UpdateClubDto {
  @ApiPropertyOptional({ example: 'Padel Milano Centro' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'info@padelmilano.it' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: ClubStatus, example: ClubStatus.ACTIVE })  
  @IsOptional()
  @IsIn([...Object.values(ClubStatus)])
  status?: ClubStatus;
}

export class ClubCourtDto {
  id: string;
  clubId: string;
  name: string;
  isIndoor: boolean;
  price: number;
  status: CourtStatus;
  offsetMinutes: number;
};




export class ClubsResDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ClubStatus, example: ClubStatus.ACTIVE })  
  status!: ClubStatus;

  @ApiProperty({ type: Number, example: 90 })
  slotDurationMinutes: number = 90;

  @ApiProperty({ type: String, example: '08:00' })
  openingTime: string = '08:00';

  @ApiProperty({ type: String, example: '23:00' })
  closingTime: string = '23:00';

  @ApiProperty({ type: String, example: 'via aldo roma, n29' })
  position: string;

  @ApiProperty({ type: Number, example: 2 })
  racketPrice: number;

  @ApiProperty({ type: Number, example: 1 })
  courtsInDoor: number;

  @ApiProperty({ type: Number, example: 2 })
  courtsOutDoor: number;

  @ApiProperty({ example: 43.20, default: 0, minimum: 0, maximum: 999})
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'il costo del campo deve essere un numero valido con massimo 2 cifre decimali' })
  @Min(0)
  @Max(999)
  averagePrice: number;

  members: ClubMemberResDto[];
}

export type ClubMemberResDto = {
  id: string;
  userId: string;
  clubId: string;
  role: ClubRole;
  permissions: string[];
};


export class ClubResDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ClubStatus, example: ClubStatus.ACTIVE })  
  status: ClubStatus;

  @ApiProperty({ type: Number, example: 90 })
  slotDurationMinutes: number = 90;

  @ApiProperty({ type: String, example: '08:00' })
  openingTime: string = '08:00';

  @ApiProperty({ type: String, example: '23:00' })
  closingTime: string = '23:00';

  @ApiProperty({ type: String, example: 'via aldo roma, n29' })
  position: string;

  @ApiProperty({ type: Number, example: 2 })
  racketPrice: number;

  @ApiProperty({type: String, example: "Europe/Rome"})
  timezone: string

  courtsInDoor: number;
  courtsOutDoor: number;
  averagePrice: number;

  @ApiProperty({type: [ClubCourtDto], description: 'Lista dei campi appartenenti al club'})
  courts: ClubCourtDto[]

  members: ClubMemberResDto[];
}


