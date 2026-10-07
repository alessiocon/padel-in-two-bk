import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Auth } from '../../auth/infrastructure/decorators/auth.decorator.js';
import { UserRole } from '../../user/domain/user.entity.js';
import { CreateTournamentDto, RegisterTeamsDto, TournamentsResDto, TournamentsTeamResDto, TournamentResDto, UpdateMatchReqDto, SetPointsmatchReqDto, TournamentMatchResDto, TournamentTeamResDto } from './tournament.dto.js';
import { Tournament } from '../domain/tournament.aggregate.js';
import { TournamentTeam } from '../domain/tournamentTeam.entity.js';
import { CreateTournamentUseCase } from '../application/create-tournament-use-cases.js';
import { RegisterTeamsUseCase } from '../application/register-teams-use-cases.js';
import { GetTournamentUseCases } from '../application/get-tournament-use-cases.js';
import { GetTournamentsUseCases } from '../application/all-tournament-use-cases.js';
import { GenerateTournamentBracketUseCase } from '../application/generate-tournament-bracket.use-case.js';
import { UpdateMatchUseCase } from '../application/update-match-use-cases.js';
import { AssignPointsMatchUseCase } from '../application/assign-point-match-use-cases.js';
import { NextMatchUseCase } from '../application/next-match-use-cases.js';
import { GetAllMatchUseCases } from '../application/all-match-use-cases.js';
import { GetAllTeamUseCases } from '../application/all-team-use-cases.js';


@ApiTags('tournament')
@ApiBearerAuth('access-token')
@Controller('tournament')
export class TournamentController {
  constructor(
    private readonly createTournament: CreateTournamentUseCase,
    private readonly registerTeams: RegisterTeamsUseCase,
    private readonly getTournament: GetTournamentUseCases,
    private readonly getAllTournament: GetTournamentsUseCases,
    private readonly generateTournamentBracket: GenerateTournamentBracketUseCase,
    private readonly getAllMatch: GetAllMatchUseCases,
    private readonly getAllTeam: GetAllTeamUseCases,
    private readonly updateTournamentMatch: UpdateMatchUseCase,
    private readonly assignPointsMatch: AssignPointsMatchUseCase,
    private readonly nextTournamentMatch: NextMatchUseCase,

  ) {}

  @Get()
  @ApiOperation({ summary: 'List Tournaments' })
  @ApiOkResponse({ type: Array<TournamentsResDto>, isArray: true })
  async findAll(): Promise<TournamentsResDto[]> {

    return await this.getAllTournament.execute(); 
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tournament by id' })
  @ApiOkResponse({ type: TournamentsResDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Tournament not found' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<TournamentResDto> {

      return await this.getTournament.execute(id);
  }

//   @Get(':id/manager')
//   @Auth(UserRole.CLUB_OWNER, UserRole.ADMIN)
//   @ApiOperation({ summary: 'Get a club by id for manager' })
//   @ApiOkResponse({ type: ClubsResDto })
//   @ApiBadRequestResponse({ description: 'Invalid UUID' })
//   @ApiNotFoundResponse({ description: 'Club not found' })
//   async findOneByManager(
//     @Param('id', new ParseUUIDPipe()) id: string,
//   ): Promise<ClubResDto> {
//     try {
//       return await this.getClub.execute(id);
//     } catch (error) {
//       throw this.toHttpError(error);
//     }
//   }

  @Post()
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a tournament' })
  @ApiBody({ type: CreateTournamentDto })
  @ApiCreatedResponse({ type: TournamentsResDto })
  @ApiBadRequestResponse({ description: 'Invalid tournament data' })
  @ApiConflictResponse({ description: 'Tournament name already exists' })
  async create(@Body() body: CreateTournamentDto): Promise<TournamentsResDto> {
    try {
        return this.toResponse(await this.createTournament.execute({
            title: body.title,
            description: body.description,
            maxTeams:body.maxTeams,
            position:body.position,
            municipality: body.municipality,
            province: body.province,
            award: body.award,
            startsAt: body.startsAt,
            endsAt: body.endsAt,
            timezone: body.timezone,
            isVisible: body.isVisible,
            showTeams: body.showTeams,
        }));
    } catch (error) {
    //   throw this.toHttpError(error);
        throw new BadRequestException("Dati non validi")
    }
  }

  @Get(":idTorunament/team")
  @ApiOperation({ summary: 'Get teams in a tournament' })
  @ApiCreatedResponse({ type: Array<TournamentTeamResDto> })
  @ApiBadRequestResponse({ description: 'Invalid tournament data' })
  async getTeams(
        @Param('idTorunament') idTournament: string) : Promise<TournamentTeamResDto[]> 
  {

    return await this.getAllTeam.execute(idTournament);
  }

  @Post(":id/team")
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add teams a tournament' })
  @ApiBody({ type: RegisterTeamsDto })
  @ApiCreatedResponse({ type: Array<TournamentsTeamResDto> })
  @ApiBadRequestResponse({ description: 'Invalid tournament data' })
  @ApiConflictResponse({ description: 'Tournament name already exists' })
  async registerTeamsById(
    @Param('id', new ParseUUIDPipe()) id: string, 
    @Body() body: RegisterTeamsDto): Promise<TournamentsTeamResDto[]> 
  {

    return this.toResponseTeams(await this.registerTeams.execute({...body, tournamentId: id}));
  }


  @Post(':id/bracket')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crea la struttura dell\'evento' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: TournamentResDto })
  public async generateBracket(@Param('id') id: string) {
    const matches = await this.generateTournamentBracket.execute(id);
    
    return matches.map(m => m.toPrimitives());
  }

  @Get(':idTorunament/match')
  @ApiOperation({ summary: 'Get All match in a tournament' })
  @ApiCreatedResponse({ type: Array<TournamentMatchResDto> })
  public async getMatches(
    @Param('idTorunament') idTournament: string,
  ) : Promise<TournamentMatchResDto[]>{

    return await this.getAllMatch.execute(idTournament);
  }

  @Patch(':idTorunament/match/:idMatch')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aggiorna un Match' })
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: UpdateMatchReqDto })
  @ApiCreatedResponse({ type: TournamentMatchResDto })
  public async updateMatch(
    @Param('idTorunament') idTournament: string,
    @Param('idMatch') idMatch: string,
    @Body() input: UpdateMatchReqDto
  ) : Promise<TournamentMatchResDto>{

    return await this.updateTournamentMatch.execute(idTournament, idMatch, input);
  }

  @Patch(':idTorunament/match/:idMatch/points')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'assegna il punteggio al match stabilendo il vincitore' })
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: SetPointsmatchReqDto })
  @ApiCreatedResponse({ type: Boolean })
  public async endMatch(
    @Param('idTorunament') idTournament: string,
    @Param('idMatch') idMatch: string,
    @Body() input: SetPointsmatchReqDto
  ) : Promise<TournamentMatchResDto>{
    return await this.assignPointsMatch.execute(idTournament, idMatch, input.sets);;
  }

  @Patch(':idTorunament/match/:idMatch/next')
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Passa automaticamente la squadra vincente al match successivo' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: TournamentMatchResDto })
  public async nextMatch(
    @Param('idTorunament') idTournament: string,
    @Param('idMatch') idMatch: string,
  ) : Promise<TournamentMatchResDto>{

    return  await this.nextTournamentMatch.execute(idTournament, idMatch);;
  }

//   @Patch(':id')
//   @ApiOperation({ summary: 'Update a club' })
//   @ApiBody({ type: UpdateClubDto })
//   @ApiOkResponse({ type: ClubResponseDto })
//   @ApiBadRequestResponse({ description: 'Invalid club data or UUID' })
//   @ApiNotFoundResponse({ description: 'Club not found' })
//   @ApiConflictResponse({ description: 'Club name already exists' })
//   async update(
//     @Param('id', new ParseUUIDPipe()) id: string,
//     @Body() body: UpdateClubDto,
//   ): Promise<ClubResponseDto> {
//     try {
//       return this.toResponse(await this.updateClub.execute({ id, ...body }));
//     } catch (error) {
//       throw this.toHttpError(error);
//     }
//   }

  // @Delete(':id')
  // @HttpCode(204)
  // @ApiOperation({ summary: 'Delete a club' })
  // @ApiNoContentResponse()
  // @ApiBadRequestResponse({ description: 'Invalid UUID' })
  // @ApiNotFoundResponse({ description: 'Club not found' })
  // async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
  //   try {
  //     await this.deleteClub.execute(id);
  //   } catch (error) {
  //     throw this.toHttpError(error);
  //   }
  // }

  private toResponse(tournament: Tournament): TournamentsResDto {
    const { updatedAt, createdAt, ...prop} = tournament.toPrimitives();
    return {...prop};
  }

  private toResponseTeams(teams: TournamentTeam[]) : TournamentsTeamResDto[]{

    let timesPrimitives : TournamentsTeamResDto[]= [] 
    teams.map(team => {
        var { updatedAt, createdAt, ...prop} = team.toPrimitives();
        timesPrimitives.push({...prop})
    })

    return timesPrimitives
  }

//   private toHttpError(error: unknown): Error {
//     if (error instanceof ClubNotFoundError) {
//       return new NotFoundException(error.message);
//     }
//     if (error instanceof ClubConflictError) {
//       return new ConflictException(error.message);
//     }
//     if (error instanceof Error && (error.message.startsWith('Club name') || error.message.startsWith('Club email'))) {
//       return new BadRequestException(error.message);
//     }
//     return new InternalServerErrorException('Unable to process club request');
//   }
}