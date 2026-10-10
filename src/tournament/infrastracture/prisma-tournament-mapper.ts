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
import { TournamentsResDto, TournamentTeamResDto, TournamentResDto, TournamentMatchResDto, MatchScoreResDto } from '../presentation/tournament.dto.js';
import { MatchStatus, TournamentMatch , MatchFormat} from '../domain/tournamentMatch.entity.js';
import { MatchScore, SetScoreProps } from '../domain/valueObject/matchScore.value.js';


export type PrismaTournamentWithRelations = PrismaTournament & {
  teams?: PrismaTournamentTeam[];
  matches?: (PrismaTournamentMatch & {
    sets?: PrismaTournamentMatchSet[]; // Sostituisci con il nome reale del modello Prisma per i set
  })[];
};


export type PrismaTournamentsSelect = Prisma.TournamentGetPayload<{
  select: typeof toTournamentsSelect;
}>;

export const toTournamentsSelect = Prisma.validator<Prisma.TournamentSelect>()({
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



export type PrismaTournamentSelect = Prisma.TournamentGetPayload<{
  select: typeof toTournamentSelect;
}>;


export const toTournamentSelect = Prisma.validator<Prisma.TournamentSelect>()({
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
});



export type PrismaTournamentMatchSelect = Prisma.TournamentMatchGetPayload<{
  select: typeof toMatchDtoSelect;
}>;

export const toMatchDtoSelect = Prisma.validator<Prisma.TournamentMatchSelect>()({
  id: true,
  tournamentId: true,
  team1Id: true,
  team2Id: true,
  format: true,
  winnerTeamId: true,
  round: true,
  matchOrder: true,
  status: true,
  scheduledAt: true,
  sets: true,
  courtId: true,
  court: {
    select: {
      name: true,
    }
  },
  team1: {
    select: {
      teamName: true,
    }
  },
  team2: {
    select: {
      teamName: true,
    }
  },
});


export type PrismaTournamentTeamSelect = Prisma.TournamentTeamGetPayload<{
  select: typeof toTeamDtoSelect;
}>;

export const toTeamDtoSelect = Prisma.validator<Prisma.TournamentTeamSelect>()({
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

      matches.push(this.prismaMatchToDomain(match));
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







  //DTO CONTOLLATI

  public static prismaTournamentToDto(raw: PrismaTournamentSelect) : TournamentResDto {

    //TODO: VALUTARE SE Eliminare lo showteams e inserirlo per ogni team cosi da non caricarlo in memoria e poi filtrare
    let teams : TournamentTeamResDto[] = []
    if(raw.showTeams){
      raw.teams.forEach(team => teams.push(this.prismaTeamToDto(team)))
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
      teams,
    }
  }

  public static prismaTournamentsToDto(raw: PrismaTournamentsSelect) : TournamentsResDto {

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
    }
  }

  public static tournamentMatchToDto(raw: Tournament, matchid: string) : TournamentMatchResDto {
    const tournament = raw.toPrimitives()
    let match =  tournament.matches.find(x => x.id === matchid);
    if(!match) throw new Error("impossibile mappare il match con id " + matchid);

    let team1 : TournamentTeam | null = null;
    if(match.team1Id){
      team1 =   tournament.teams.find(x => x.id === match.team1Id) ?? null;
      if(!team1) throw new Error("impossibile trovare il primo team con id" + match.team1Id);
    }

    let team2 : TournamentTeam | null = null;
    if(match.team2Id){
      team2 =   tournament.teams.find(x => x.id === match.team2Id) ?? null;
      if(!team2) throw new Error("impossibile trovare il secondo team con id" + match.team1Id);
    }
   

   
    if(!team2) throw new Error("impossibile trovare il secondo team con id" + match.team2Id);

    return {
        id: match.id,
        tournamentId: tournament.id,
        courtId: match.courtId,
        courtName: null, //TODO: DA SISTEMARE QUANDO AVRO LA LOGICA PER L'ASSOCAZIONE CAMPO TORNEO
        team1Id: match.team1Id,
        team1Name: team1 ? team1.teamName : null,
        team2Id: match.team2Id,
        team2Name: team2.teamName ?? null,
        winnerTeamId: match.winnerTeamId,
        round: match.round,
        matchOrder: match.matchOrder,
        format: this.PRISMA_TO_DOMAIN_MATCH_FORMAT[match.format],
        status: this.PRISMA_TO_DOMAIN_MATCH_STATUS[match.status],
        scheduledAt: match.scheduledAt,
        sets: match.score?.value,
      };
  }

  public static prismaMatchToDomain(raw: PrismaTournamentMatch & { sets?: PrismaTournamentMatchSet[]}) : TournamentMatch 
  {
    let scoreProsp : SetScoreProps[] = []
      
    raw.sets?.forEach(set => {
      scoreProsp.push({
        setNumber: set.setNumber,
        team1Games: set.team1Games,
        team2Games: set.team2Games,
        tieBreak: set.tieBreak
      })
    });

    const setScores =  scoreProsp.length === 0 
      ? null
      : MatchScore.create(scoreProsp, this.PRISMA_TO_DOMAIN_MATCH_FORMAT[raw.format])

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
      score: setScores,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static PrismaMatchToDto(raw: PrismaTournamentMatchSelect ) : TournamentMatchResDto {

  let sets : MatchScoreResDto[] = []
    raw.sets?.forEach(set => {
      sets.push({
        setNumber: set.setNumber,
        team1Games: set.team1Games,
        team2Games: set.team2Games,
        tieBreak: set.tieBreak
      })
  });

  return {
    id: raw.id,
    tournamentId: raw.tournamentId,
    courtId: raw.courtId,
    courtName: raw.court?.name ?? null,
    team1Id: raw.team1Id,
    team1Name: raw.team1?.teamName ?? null,
    team2Id: raw.team2Id,
    team2Name: raw.team2?.teamName ?? null,
    winnerTeamId: raw.winnerTeamId,
    round: raw.round,
    matchOrder: raw.matchOrder,
    format: this.PRISMA_TO_DOMAIN_MATCH_FORMAT[raw.format],
    status: this.PRISMA_TO_DOMAIN_MATCH_STATUS[raw.status],
    scheduledAt: raw.scheduledAt,
    sets: sets,
  };
  }

  public static prismaTeamToDto(raw: PrismaTournamentTeamSelect ) : TournamentTeamResDto {

    return {
      id: raw.id,
      tournamentId: raw.id,
      player1Id: raw.player1Id,
      player2Id: raw.player2Id,
      player2FName: raw.player2FName,
      player2LName: raw.player2LName,
      player2Phone: raw.player2Phone,
      teamName: raw.teamName,
      player1: {
        firstName: raw.player1.firstName,
        lastName: raw.player1.lastName,
        phone: raw.player1.phone,
        username: raw.player1.username
        
      },
      player2: !raw.player2 ? null : {
        firstName: raw.player2.firstName,
        lastName: raw.player2.lastName,
        phone: raw.player2.phone,
        username: raw.player2.username
      }
    }
  }
}