import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, isString, IsString, IsUUID, Max, MaxLength, Min, ValidateIf, ValidateNested } from "class-validator";

export class CreateTournamentDto {
  @ApiProperty({ example: 'PadelFlash' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'Evento in un unica serata per principianti avanzati e intermedi base' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  description!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-02T19:00:00.000Z'})
  @IsDateString()
  startsAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-02T22:00:00.000Z'})
  @IsDateString()
  endsAt: string;

  @ApiProperty({ example: 8, default: 8, minimum: 8, maximum: 32 , })
  @IsInt()
  maxTeams: number = 0;

  @ApiProperty({ example: 'Via atellana 65, Arzano' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  position: string;

  @ApiProperty({ example: 'Arzano' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  municipality: string;

  @ApiProperty({ example: 'Napoli' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  province: string;

  @ApiProperty({ example: '100€' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  award: string;
  
  @ApiProperty({type: String, example: "Europe/Rome", default: "Europe/Rome" })
  @IsOptional()
  timezone: string

  @ApiProperty({ example: 30, default: 0, minimum: 0, maximum: 999})
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'il costo del evento deve essere un numero valido con massimo 2 cifre decimali' })
  @Min(0)
  @Max(999)
  price: number;

  @ApiProperty({ type: Boolean , example: true, default: true})
  @IsBoolean()
  isVisible: boolean;

  @ApiProperty({ type: Boolean , example: true, default: true})
  @IsBoolean()
  showTeams: boolean;
}


export class RegisterTeamsDto{
    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    tournamentId: string;

    @ApiProperty({ 
        type: () => [RegisterTeamDto], 
        description: 'Lista delle squadre da registrare' 
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    teams: RegisterTeamDto[];
}

export class RegisterTeamDto {
    @ApiProperty({ example: 'Team 1' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    teamName: string;

    @ApiProperty({ format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    player1Id: string;

    @ApiProperty({ format: 'uuid' })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsUUID()
    player2Id: string | null;

    @ApiProperty({ example: 'Mario' })
    @IsOptional()
    @IsString()
    player2FName:string | null;

    @ApiProperty({ example: 'Rossi' })
    @IsOptional()
    @IsString()
    player2LName:string | null;

    @ApiProperty({ example: '+323278457547' })
    @IsOptional()
    @IsPhoneNumber()
    player2Phone: string | null;
}

export class TournamentsResDto {
    id: string;
    title: string;
    description: string | null;
    position: string;
    municipality: string;
    province: string;
    award: string;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    maxTeams: number;
    isClosed: boolean;
    isVisible: boolean;
    showTeams: boolean;
    teams: TournamentsTeamResDto[];
}


export class TournamentsTeamResDto{
    id: string;
    tournamentId: string;
    teamName: string;
    player1Id: string;
    player2Id: string | null;
    player2FName:string | null;
    player2LName:string | null;
    player2Phone: string | null;
}

export class TournamentResDto{
    id: string;
    title: string;
    description: string | null;
    position: string;
    municipality: string;
    province: string;
    award: string;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    maxTeams: number;
    isClosed: boolean;
    isVisible: boolean;
    showTeams: boolean;
    teams: TournamentTeamResDto[];
}

export class TournamentTeamResDto{
    id: string;
    tournamentId: string;
    teamName: string;
    player1Id: string;
    player2Id: string | null;
    player2FName:string | null;
    player2LName:string | null;
    player2Phone: string | null;
    player1: TournamentTeamPlayerResDto | null;
    player2: TournamentTeamPlayerResDto | null;
}

export class TournamentTeamPlayerResDto{
    firstName: string;
    lastName: string;
    phone: string | null;
    username: string;
}
