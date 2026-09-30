import { Tournament as PrismaTournament, TournamentTeam as PrismaTournamentTeam, Prisma } from '@prisma/client';
import { Tournament } from './../domain/tournament.aggregate.js';
import { TournamentTeam } from './../domain/tournamentTeam.entity.js';
import { TournamentsResDto, TournamentTeamResDto, TournamentResDto } from '../presentation/tournament.dto.js';

export type PrismaTournamentWithRelations = PrismaTournament & {
  teams?: PrismaTournamentTeam[];
};

export type PrismaTournamentSummarySelect = Prisma.TournamentGetPayload<{
  select: typeof tournamentSummarySelect;
}>;

export type PrismaTournamentAndUserSelect = Prisma.TournamentGetPayload<{
  select: typeof tournamentAndUserSelect;
}>;


export const tournamentSummarySelect = Prisma.validator<Prisma.TournamentSelect>()({
  id: true,
  title: true,
  description: true,
  position: true,
  municipality: true,
  province: true,
  award: true,
  startsAt: true,
  timezone: true,
  endsAt: true,
  maxTeams: true,
  isClosed: true,
  isVisible: true,
  showTeams: true
});

export const tournamentAndUserSelect = Prisma.validator<Prisma.TournamentSelect>()({
  id: true,
  title: true,
  description: true,
  position: true,
  municipality: true,
  province: true,
  award: true,
  startsAt: true,
  timezone: true,
  endsAt: true,
  maxTeams: true,
  isClosed: true,
  isVisible: true,
  showTeams: true,
  teams: {
    select: {
      id: true,
      teamName: true,
      player1Id:true,
      player2Id: true,
      player2FName: true,
      player2LName: true,
      player2Phone: true,
      player1: true,
      player2: true
    },
    include: {
      player1: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          username: true
        }
      },
      player2:{
        select:{
          firstName: true,
          lastName: true,
          phone: true,
          username: true
        }
      },
    }
  }
});



export class TournamentMapper {
  public static toDomain(raw: PrismaTournamentWithRelations): Tournament {
    
    //TODO FIltra i teams in memoria dopo che ha acquisito la porprietà showteams, questo si puo risolvere in diversi modi:
    //con una mini query alla proprietà e poi in base al true o false si includono i teams
    //inserendo lo showTeams direttamente nel TournamentTeams, ma a quel punto chiamarlo isVisible, poi quando si devono oscurare o si fa singolarmente o tramite opzione si cicla il valore
    let teams : TournamentTeam[] = []
    if(raw.showTeams){
      raw.teams?.forEach(team => {
        teams.push(TournamentTeam.reconstitute({
        id: team.id,
        tournamentId: team.tournamentId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player2FName: team.player2FName,
        player2LName: team.player2FName,
        player2Phone: team.player2Phone,
        

        teamName: team.teamName,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
        }))
      })
    }
    return Tournament.reconstitute({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      position: raw.position,
      municipality: raw.municipality,
      province: raw.province,
      award: raw.award,
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      timezone: raw.timezone,
      maxTeams: raw.maxTeams,
      isClosed: raw.isClosed,
      isVisible: raw.isVisible,
      showTeams: raw.showTeams,
      teams,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    });
  }

  public static toTournamentPersistence(tournament: Tournament ): PrismaTournament {
    const primitives = tournament.toPrimitives();

    return {
      id: primitives.id,
      title: primitives.title,
      description: primitives.description,
      position: primitives.position,
      municipality: primitives.municipality,
      province: primitives.province,
      award: primitives.award,
      startsAt: primitives.startsAt,
      endsAt: primitives.endsAt,
      timezone: primitives.timezone,

      isClosed:primitives.isClosed,
      isVisible: primitives.isVisible,
      showTeams: primitives.showTeams,
      maxTeams:primitives.maxTeams,

      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt
    }
  }

  public static toTournamentTeamPersistence(team: TournamentTeam): PrismaTournamentTeam {
    const primitives = team.toPrimitives();

    return {
        id: primitives.id,
        tournamentId: team.tournamentId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player2FName: team.player2FName,
        player2LName: team.player2FName,
        player2Phone: team.player2Phone,

        teamName: team.teamName,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }
  }


  public static toSummaryDto(raw: PrismaTournamentSummarySelect) : TournamentsResDto {

    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      position: raw.position,
      municipality: raw.municipality,
      province: raw.province,
      award: raw.award,
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      timezone: raw.timezone,
      maxTeams: raw.maxTeams,
      isClosed: raw.isClosed,
      isVisible: raw.isVisible,
      showTeams: raw.showTeams,
      teams: []
    }
  }

  public static toTournamentWithUserDto(raw: PrismaTournamentAndUserSelect) : TournamentResDto {

    let teams : TournamentTeamResDto[] = []
    if(raw.showTeams){
      raw.teams.forEach(team => {
        teams.push({
          id: team.id,
          tournamentId: team.tournamentId,
          player1Id: team.player1Id,
          player2Id: team.player2Id,
          player2FName: team.player2FName,
          player2LName: team.player2LName,
          player2Phone: team.player2Phone,
          teamName: team.teamName,
          player1: {
            firstName: team.player1.firstName,
            lastName: team.player1.lastName,
            phone: team.player1.phone,
            username: team.player1.username
            
          },
          player2: !team.player2 ? null : {
            firstName: team.player2.firstName,
            lastName: team.player2.lastName,
            phone: team.player2.phone,
            username: team.player2.username
          }
        })
      })
    }

    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      position: raw.position,
      municipality: raw.municipality,
      province: raw.province,
      award: raw.award,
      startsAt: raw.startsAt,
      endsAt: raw.endsAt,
      timezone: raw.timezone,
      maxTeams: raw.maxTeams,
      isClosed: raw.isClosed,
      isVisible: raw.isVisible,
      showTeams: raw.showTeams,
      teams: teams
    }
  }
}