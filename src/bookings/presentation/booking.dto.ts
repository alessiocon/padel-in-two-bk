import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsUUID, IsOptional, MaxLength, IsString, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize, ArrayNotEmpty, IsBoolean, Max, Min, IsInt, IsEnum } from 'class-validator';
import { BookingCancBy, BookingStatus } from '../domain/booking.aggregate.js';
import { Type } from 'class-transformer';
import { BookingPlayerStatus } from '../domain/entity/booking.player.entity.js';
import { BookingEventType } from '../domain/valueObject/booking.log.value.js';
import { MatchFormat } from '../../tournament/domain/tournamentMatch.entity.js';
import { MatchPropose } from '../domain/entity/booking.match.entity.js';
import { BookingMatchScore, BookingSetScoreProps } from '../domain/valueObject/booking.score.value.js';
import { PromotionType } from '../../promotions/domain/promotion-type.js';




export class CreateBookingPlayerDto {
  @ApiProperty({ 
    format: 'uuid', 
    description: 'ID player registrato (se il giocatore ha un account)', 
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @ApiProperty({ 
    description: 'Nome del giocatore (obbligatorio se GUEST/senza account)', 
    required: false,
    example: 'Mario'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username?: string;


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

export class InviteBookingPlayerDto extends CreateBookingPlayerDto {
  @ApiProperty({ format: 'uuid', description: 'ID della squadra da aggiornare' })
  @IsUUID()
  teamId!: string;
}


export class RemovePlayerInBookingTeamReqDto {
  @ApiProperty({ format: 'uuid', description: 'ID della squadra da aggiornare' })
  @IsUUID()
  teamId!: string;

  @ApiProperty({ format: 'uuid', description: 'ID del giocatore da rimuovere' })
  @IsUUID()
  playerId!: string;


  @ApiProperty({type: String, description: 'username o nome del giocatore', example: 'Mario Rossi', required: true})
  username!: string;
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
    description: 'ID del Club',
    example: 'd3b07384-d113-4ec7-a49d-263267d36371'
  })
  @IsUUID()
  clubId!: string;

  @ApiProperty({ 
    format: 'uuid', 
    description: 'ID del campo da padel da prenotare',
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
  // @ArrayMinSize(1, { message: 'La prenotazione deve includere almeno una squadra' })
  // @ArrayMaxSize(2, { message: 'Una prenotazione di padel standard prevede al massimo 2 squadre' })
  teams!: CreateBookingTeamDto[];
}


export class UpdateBookingPlayerDto {
  @ApiProperty({type: Boolean, description: 'Indica se il giocatore ha accettato o meno la prenotazione', example: true, required: false})
  @IsIn([true, false], { message: 'Il valore deve essere true o false' }) 
  accepted: boolean;
}




export class SearchBookingQuery {
   from?: string;
   to?: string;
   clubId?: string;
   createdById?: string;
   playerId?: string;
   member?: string; 
   status?: BookingStatus
}


export class MatchProposeDto {
  @ApiProperty({ description: 'Numero del set', example: 1 })
  @IsInt({ message: 'Il numero del set dev\' essere un numero' })
  @Min(0, { message: 'Il numero del set dev\' essere un numero positivo' })
  setNumber: number;

  @ApiProperty({ description: 'Game vinti dalla squadra 1', example: 6 })
  @IsInt({ message: 'Team 1 games must be an integer' })
  @Min(0, { message: 'Team 1 games cannot be negative' })
  @Max(7, { message: 'Team 1 games cannot exceed 7' })
  team1Games: number;

  @ApiProperty({ description: 'Game vinti dalla squadra 2', example: 4 })
  @IsInt({ message: 'Team 2 games must be an integer' })
  @Min(0, { message: 'Team 2 games cannot be negative' })
  @Max(7, { message: 'Team 2 games cannot exceed 7' })
  team2Games: number;

  @ApiProperty({ description: 'Indica se il set è terminato al tie-break', example: false })
  @IsBoolean({ message: 'Tie break must be a boolean value' })
  tieBreak: boolean;
}


export class BookingResultProposeDto {
  @ApiProperty({ 
    type: () => [MatchProposeDto], 
    description: 'Lista dei risultati dei set/match proposti' 
  })
  @IsArray({ message: 'Matches must be an array' })
  @ArrayNotEmpty({ message: 'At least one match/set result must be provided' })
  @ValidateNested({ each: true })
  @Type(() => MatchProposeDto)
  matches: MatchProposeDto[];

  @ApiProperty({ 
    enum: MatchFormat, 
    description: 'Formato della partita (es. SINGLE_SET, BEST_OF_THREE)' 
  })
  @IsNotEmpty({ message: 'Match format is required' })
  @IsEnum(MatchFormat, { message: 'Invalid match format specified' })
  format: MatchFormat;

  @ApiProperty({ description: 'Indica se l\'azione è eseguita da un membro dello staff', example: false })
  @IsNotEmpty({ message: 'isStaff field is required' })
  @IsBoolean({ message: 'isStaff must be a boolean value' })
  isStaff: boolean;
}


export class BookingIsAcceptedMatchProposeDto {
  @ApiProperty({ description: 'Indica se la proposta di risultato viene accettata (true) o rifiutata (false)', example: true })
  @IsNotEmpty({ message: 'isAccepted field is required' })
  @IsBoolean({ message: 'isAccepted must be a boolean value' })
  isAccepted: boolean;

  @ApiProperty({ description: 'Indica se l\'azione è eseguita da un membro dello staff', example: false })
  @IsNotEmpty({ message: 'isStaff field is required' })
  @IsBoolean({ message: 'isStaff must be a boolean value' })
  isStaff: boolean;
}

export class BookingRemoveMatchProposeDto {
  @ApiProperty({ description: 'Indica se l\'azione è eseguita da un membro dello staff', example: true })
  @IsNotEmpty({ message: 'isStaff field is required' })
  @IsBoolean({ message: 'isStaff must be a boolean value' })
  isStaff: boolean;
}





export class UpdateBookingDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.RESERVED })
  @IsOptional()
  status?: BookingStatus;

  @ApiProperty({ type: String })
  clubId: string;
}




export class BookingQuickResDto{
    id: string;
    clubId: string;
    clubName: string;

    courtId: string;
    courtName: string;
    isCourtIndoor: boolean;
    createdByStaff: boolean;

    nPlayer: number;

    status: BookingStatus;
    description: string;
    startsAt: string;
    endsAt: string;
    price: number;
    
    // @ApiProperty({ enum: PromotionType, isArray: true })
    eligiblePromotions!: PromotionType[];

    createdAt: Date;
}
export class BookingDetailResDto {
    id: string;
    clubId: string;
    clubName: string;

    courtId: string;
    courtName: string;
    courtSize: number;
    isCourtIndoor: boolean;

    position: string;
    status: BookingStatus;
    description: string;
    startsAt: string;
    endsAt: string;
    price: number;
    isIndoor: boolean;

    createdBy: {
        id: string,
        username: string,
        firstName: string,
        lastName: string,
    } | null;
    createdByStaff: boolean;
    teams: BookingTeamResDto[];
    logs: BookingLogResDto[];

    cancBy: BookingCancBy | null;
    cancAt: Date | null;
    cancPostConfirm: boolean | null;
    cancReason: string | null;

    // @ApiProperty({ enum: PromotionType, isArray: true })
    eligiblePromotions!: PromotionType[];

    createdAt: Date;
}

export class BookingLogResDto{
  eventType: BookingEventType;
  message: string;
  username: string | null;
  createdAt: string;
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
  playerId?: string;
  status: BookingPlayerStatus;
  type: 'GUEST' | 'REGISTERED';
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}


export class BookingMatchResDto {
    id: string;       
    bookingId: string;   
    winnerTeamNumber: number;
    format: MatchFormat;

    proposeByTeamId?: string;
    proposeTeamName?: string;
    proposePlayerIds?: string[];
    pendingPlayerIds?: string[];

    team1Name: string;
    team2Name: string;

    proposeNumber: number;
    status: MatchPropose;
    sets: BookingSetScoreProps[];
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