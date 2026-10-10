import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsUUID, IsOptional, MaxLength, IsString, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { BookingCancBy, BookingStatus } from '../domain/booking.aggregate.js';
import { Type } from 'class-transformer';
import { BookingTeam } from '../domain/entity/booking.team.entity.js';
import { BookingPlayer, BookingPlayerStatus } from '../domain/entity/booking.player.entity.js';
import { BookingAuditLog, BookingEventType } from '../domain/valueObject/booking.auditLog.value.js';




export class CreateBookingPlayerDto {
  @ApiProperty({ 
    format: 'uuid', 
    description: 'ID utente registrato (se il giocatore ha un account)', 
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ 
    description: 'Nome del giocatore (obbligatorio se GUEST/senza account)', 
    required: false,
    example: 'Mario'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ 
    description: 'Cognome del giocatore (obbligatorio se GUEST/senza account)', 
    required: false,
    example: 'Rossi'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ 
    description: 'Recapito telefonico dell\'ospite', 
    required: false,
    example: '+393331234567'
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class CreateBookingTeamDto {
  @ApiProperty({ 
    description: 'Nome della squadra', 
    example: 'Team Alpha' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  teamName!: string;

  @ApiProperty({ 
    type: [CreateBookingPlayerDto], 
    description: 'Lista dei giocatori che compongono la squadra (es. 1 o 2 giocatori per il padel)' 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingPlayerDto)
  @ArrayMinSize(1, { message: 'Ogni squadra deve avere almeno un giocatore' })
  @ArrayMaxSize(2, { message: 'Nel padel una squadra non può avere più di 2 giocatori' })
  players!: CreateBookingPlayerDto[];
}

export class CreateBookingDto {
  @ApiProperty({ 
    format: 'uuid', 
    description: 'ID del campo da tennis/padel da prenotare',
    example: 'd3b07384-d113-4ec7-a49d-263267d36371'
  })
  @IsUUID()
  courtId!: string;

  @ApiProperty({ 
    type: String, 
    description: 'Note aggiuntive o riferimenti per la prenotazione',
    example: "Partita amichevole infrasettimanale", 
    required: false 
  })
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ 
    type: String, 
    format: 'date-time', 
    description: 'Data e ora di inizio della prenotazione in formato ISO 8601',
    example: '2026-10-15T18:00:00.000Z' 
  })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ 
    type: Number, 
    description: 'Numero di slot orari da occupare (es. 1 slot = 30min/1h a seconda della configurazione del club)',
    example: 2,
    enum: [1, 2]
  })
  @IsIn([1, 2], { message: 'Il numero di slot deve essere 1 o 2' })
  slots!: number;

  @ApiProperty({ 
    type: [CreateBookingTeamDto], 
    description: 'Elenco delle squadre partecipanti alla prenotazione (es. Squadra 1 e Squadra 2)' 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingTeamDto)
  @ArrayMinSize(1, { message: 'La prenotazione deve includere almeno una squadra' })
  @ArrayMaxSize(2, { message: 'Una prenotazione di padel standard prevede al massimo 2 squadre' })
  teams!: CreateBookingTeamDto[];
}


























export class UpdateBookingDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.RESERVED })
  @IsOptional()
  status?: BookingStatus;

  @ApiProperty({ type: String })
  clubId: string;
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
    clubId: string;
    courtId: string;
    createdBy: {
        id: string,
        username: string,
        firstName: string,
        lastName: string,
    } | null;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    status: BookingStatus;
    teams: BookingTeamResDto[];
    auditLogs: BookingAuditLogResDto[];

    cancBy: BookingCancBy | null;
    cancAt: Date | null;
    cancPostConfirm: boolean | null;
    cancReason: string | null;

    createdAt: Date;
}

export class BookingTeamResDto{
  id: string;
  teamNumber: number;
  teamName: string;  
  players: BookingPlayerResDto[];
}

export class BookingPlayerResDto{
  id: string;
  username?: string;
  userId?: string;
  status: BookingPlayerStatus;
  type: 'GUEST' | 'REGISTERED';
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

export class BookingAuditLogResDto{
  eventType: BookingEventType;
  message: string;
  username: string | null;
  createdAt: Date;
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

export class DeleteBookingDto{
  @ApiProperty({ 
    type: Boolean, 
    description: 'identificare se la richiesta parte da un utente o dallo staff',
    example: false,
    required: true })
  isStaff: boolean

  @ApiProperty({ 
    type: String, 
    description: 'Descrive il motivo della cancellazioe della prenotazione',
    example: "Non posso più venire",
    required: false })
  reason?: string;
}

export class RestoreBookingStatusDto{
  @ApiProperty({ 
    type: Boolean, 
    description: 'identificare se la richiesta parte da un utente o dallo staff',
    example: false,
    required: true })
  isStaff: boolean;
}
