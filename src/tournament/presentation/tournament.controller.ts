import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
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
import { CreateTournamentDto, RegisterTeamsDto, TournamentsResDto, TournamentsTeamResDto, TournamentResDto } from './tournament.dto.js';
import { Tournament } from '../domain/tournament.aggregate.js';
import { TournamentTeam } from '../domain/tournamentTeam.entity.js';
import { CreateTournamentUseCase } from '../application/create-tournament-use-cases.js';
import { RegisterTeamsUseCase } from '../application/register-teams-use-cases.js';
import { GetTournamentUseCases } from '../application/get-tournament-use-cases.js';
import { GetTournamentsUseCases } from '../application/all-tournament-use-cases.js';


@ApiTags('tournament')
@ApiBearerAuth('access-token')
@Controller('tournament')
export class TournamentController {
  constructor(
    private readonly createTournament: CreateTournamentUseCase,
    private readonly registerTeams: RegisterTeamsUseCase,
    private readonly getTournament: GetTournamentUseCases,
    private readonly getAllTournament: GetTournamentsUseCases

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

  @Post(":id/teams")
  @Auth(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add teams a tournament' })
  @ApiBody({ type: RegisterTeamsDto })
  @ApiCreatedResponse({ type: TournamentsResDto })
  @ApiBadRequestResponse({ description: 'Invalid tournament data' })
  @ApiConflictResponse({ description: 'Tournament name already exists' })
  async tregisterTeams(@Body() body: RegisterTeamsDto): Promise<TournamentsTeamResDto[]> {

    return this.toResponseTeams(await this.registerTeams.execute({...body}));
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