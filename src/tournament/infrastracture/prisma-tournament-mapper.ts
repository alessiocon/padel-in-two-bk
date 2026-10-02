import { 
  Tournament as PrismaTournament, 
  TournamentTeam as PrismaTournamentTeam, 
  TournamentMatch as PrismaTournamentMatch, 
  MatchStatus as PrismaMatchStatus,
  MatchFormat as PrismaMatchFormat,
  TournamentMatchSet as PrismaTournamentMatchSet,
  Prisma
} from '@prisma/client';
import { Tournament } from './../domain/tournament.aggregate.js';
import { TournamentTeam } from './../domain/tournamentTeam.entity.js';
import { TournamentsResDto, TournamentTeamResDto, TournamentResDto, TournamentMatchResDto } from '../presentation/tournament.dto.js';
import { MatchStatus, TournamentMatch , MatchFormat} from '../domain/tournamentMatch.entity.js';
import { MatchScore, SetScoreProps } from '../domain/valueObject/matchScore.value.js';


export type PrismaTournamentWithRelations = PrismaTournament & {
  teams?: PrismaTournamentTeam[];
  matches?: (PrismaTournamentMatch & {
    sets?: PrismaTournamentMatchSet[]; // Sostituisci con il nome reale del modello Prisma per i set
  })[];
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
      player1Id: true,
      player2Id: true,
      player2FName: true,
      player2LName: true,
      player2Phone: true,
      player1: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          username: true,
        },
      },
      player2: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          username: true,
        },
      },
    },
  },
  matches: {
    select: {
      id: true,
      tournamentId: true,
      courtId: true,
      team1Id: true,
      team2Id: true,
      format: true,
      winnerTeamId: true,
      round: true,
      matchOrder: true,
      status: true,
      scheduledAt: true,
      sets: true,
      court: {
        select: {
          name: true,
        },
      },
      team1: {
        select: {
          teamName: true,
        },
      },
      team2: {
        select: {
          teamName: true,
        },
      },
    },
  },
});



export class TournamentMapper {

  public static readonly PRISMA_TO_DOMAIN_MATCH_STATUS: Record<
    PrismaMatchStatus,
    MatchStatus
  > = {
    [PrismaMatchStatus.SCHEDULED]:    MatchStatus.SCHEDULED,
    [PrismaMatchStatus.IN_PROGRESS]:  MatchStatus.IN_PROGRESS,
    [PrismaMatchStatus.COMPLETED]:    MatchStatus.COMPLETED,
    [PrismaMatchStatus.CANCELLED]:    MatchStatus.CANCELLED,
  };

  public static readonly DOMAIN_TO_PRISMA_MATCH_STATUS: Record<
    MatchStatus,
    PrismaMatchStatus
  > = {
    [MatchStatus.SCHEDULED]:    PrismaMatchStatus.SCHEDULED,
    [MatchStatus.IN_PROGRESS]:  PrismaMatchStatus.IN_PROGRESS,
    [MatchStatus.COMPLETED]:    PrismaMatchStatus.COMPLETED,
    [MatchStatus.CANCELLED]:    PrismaMatchStatus.CANCELLED,
  };

  public static readonly PRISMA_TO_DOMAIN_MATCH_FORMAT: Record<
    PrismaMatchFormat,
    MatchFormat
  > = {
    [PrismaMatchFormat.SINGLE_SET]:  MatchFormat.SINGLE_SET,
    [PrismaMatchFormat.BEST_OF_3]:    MatchFormat.BEST_OF_3,

  };

  public static readonly DOMAIN_TO_PRISMA_MATCH_FORMAT: Record<
    MatchFormat,
    PrismaMatchFormat
  > = {
    [MatchFormat.SINGLE_SET]:  PrismaMatchFormat.SINGLE_SET,
    [MatchFormat.BEST_OF_3]:   PrismaMatchFormat.BEST_OF_3,
  };


  public static toDomain(raw: PrismaTournamentWithRelations): Tournament {
    
    //TODO FIltra i teams in memoria dopo che ha acquisito la porprietà showteams, questo si puo risolvere in diversi modi:
    //con una mini query alla proprietà e poi in base al true o false si includono i teams
    //inserendo lo showTeams direttamente nel TournamentTeams, ma a quel punto chiamarlo isVisible, poi quando si devono oscurare o si fa singolarmente o tramite opzione si cicla il valore
    //ORA NON TE NE PREOCCUPARE
    let teams : TournamentTeam[] = [];
    let matches : TournamentMatch[] = [];

    if(raw.showTeams){
      raw.teams?.forEach(team => {
        teams.push(TournamentTeam.reconstitute({
        id: team.id,
        tournamentId: team.tournamentId,
        player1Id: team.player1Id,
        player2Id: team.player2Id,
        player2FName: team.player2FName,
        player2LName: team.player2LName,
        player2Phone: team.player2Phone,
        

        teamName: team.teamName,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
        }))
      })
    }

    raw.matches?.forEach(match => {

      let scoreProsp : SetScoreProps[] = []
      
      match.sets?.forEach(set => {
       scoreProsp.push({
          setNumber: set.setNumber,
          team1Games: set.team1Games,
          team2Games: set.team2Games,
          tieBreak: set.tieBreak
       })
      });
      const setScores =  scoreProsp.length === 0 ? null: MatchScore.create(scoreProsp, this.PRISMA_TO_DOMAIN_MATCH_FORMAT[match.format])
     

      matches.push(TournamentMatch.reconstitute({
        id: match.id,
        courtId: match.courtId,
        tournamentId: match.tournamentId,
        status: this.PRISMA_TO_DOMAIN_MATCH_STATUS[match.status],
        team1Id:match.team1Id,
        team2Id:match.team2Id,
        winnerTeamId:match.winnerTeamId,
        round:match.round,
        format: this.PRISMA_TO_DOMAIN_MATCH_FORMAT[match.format],
        matchOrder:match.matchOrder,
        score: setScores, 
        scheduledAt:match.scheduledAt,
        createdAt:match.createdAt,
        updatedAt:match.updatedAt
      }))
    })



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
      matches,
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
        player2LName: team.player2LName,
        player2Phone: team.player2Phone,

        teamName: team.teamName,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }
  }

  public static toTournamentMatchPersistence(match: TournamentMatch): Prisma.TournamentMatchUncheckedCreateInput {
    const primitives = match.toPrimitives();

    return {
      id: primitives.id,
      tournamentId: primitives.tournamentId,
      courtId: primitives.courtId,
      team1Id: primitives.team1Id,
      team2Id: primitives.team2Id,
      winnerTeamId: primitives.winnerTeamId,
      round: primitives.round,
      format: this.DOMAIN_TO_PRISMA_MATCH_FORMAT[primitives.format],
      matchOrder: primitives.matchOrder,
      status: this.PRISMA_TO_DOMAIN_MATCH_STATUS[primitives.status],
      scheduledAt: primitives.scheduledAt,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt,
    };
  }

  public static matchToDomain(raw: PrismaTournamentMatch): TournamentMatch {
    return TournamentMatch.reconstitute({
      id: raw.id,
      tournamentId: raw.tournamentId,
      courtId: raw.courtId,
      team1Id: raw.team1Id,
      team2Id: raw.team2Id,
      winnerTeamId: raw.winnerTeamId,
      round: raw.round,
      matchOrder: raw.matchOrder,
      format: this.PRISMA_TO_DOMAIN_MATCH_FORMAT[raw.format],
      status: this.PRISMA_TO_DOMAIN_MATCH_STATUS[raw.status],
      scheduledAt: raw.scheduledAt,
      // Se hai salvato il punteggio (JSON o relazioni di set), qui lo ricostruisci nel Value Object
      score: null, 
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
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
          tournamentId: team.id,
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

     let matches : TournamentMatchResDto[] = []
     raw.matches.forEach(match => {
      matches.push({
        id: match.id,
        tournamentId: match.tournamentId,
        courtId: match.courtId,
        courtName: match.court?.name ?? null,
        team1Id: match.team1Id,
        team2Id: match.team2Id,
        team1Name: match.team1?.teamName ?? null,
        team2Name: match.team2?.teamName ?? null,
        format: this.PRISMA_TO_DOMAIN_MATCH_FORMAT[match.format],
        winnerTeamId: match.winnerTeamId,
        round: match.round,
        matchOrder: match.matchOrder,
        status: this.PRISMA_TO_DOMAIN_MATCH_STATUS[match.status],
        scheduledAt: match.scheduledAt,
        score: match.sets.map((set) => {
         return {
            id: set.id,
            setNumber: set.setNumber,
            team1Games: set.team1Games,
            team2Games: set.team2Games,
            tieBreak: set.tieBreak
         }
        })
       
      })
     })

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
      teams,
      matches
    }
  }
}