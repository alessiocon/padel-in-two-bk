import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { TournamentRepository } from './../domain/tournament-IRepository.js';
import { Tournament } from './../domain/tournament.aggregate.js';
import { toMatchDtoSelect, toTournamentSelect, TournamentMapper, toTournamentsSelect, toTeamDtoSelect } from './prisma-tournament-mapper.js';
import { TournamentTeam } from '../domain/tournamentTeam.entity.js';
import { TournamentsResDto, TournamentResDto, TournamentMatchResDto, TournamentTeamResDto } from '../presentation/tournament.dto.js';
import { TournamentMatch } from '../domain/tournamentMatch.entity.js';

@Injectable()
export class PrismaTournamentRepository implements TournamentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tournament> {
    const record = await this.prisma.tournament.findUnique({
      where: { id: id},
      include: { teams: true, matches: true },
    });

    if (!record) {
       throw new NotFoundException("Torneo non trovato");
    }

    return TournamentMapper.toDomain(record);
  }

  async findAll(): Promise<Tournament[]> {
    const records = await this.prisma.tournament.findMany({
      include: { teams: true },
      orderBy: { startsAt: 'asc' },
    });

    return records.map((record) => TournamentMapper.toDomain(record));
  }

  async create(tournament: Tournament): Promise<Tournament> {

    try {
          const record = await this.prisma.$transaction(async (transaction) => {
            await transaction.tournament.create({ data: TournamentMapper.toTournamentPersistence(tournament) });
            await transaction.tournamentTeam.createMany({
              data: tournament.teams.map((team) => TournamentMapper.toTournamentTeamPersistence(team)),
            });

            return transaction.tournament.findUniqueOrThrow({
              where: { id: tournament.id },
              include: { teams: true },
            });
          });

          return TournamentMapper.toDomain(record);
        } catch (error) {
          throw new BadRequestException("richiesta non accettata")
        }
  }

  async saveTeams(tournamentId: string, teams: TournamentTeam[]): Promise<TournamentTeam[]> {
    try {
          const record = await this.prisma.$transaction(async (tx) => {
            await Promise.all(
                teams.map((team) =>
                    tx.tournamentTeam.upsert({
                        where: { id: team.id },
                        create: {
                            id: team.id,
                            tournamentId,
                            teamName: team.teamName,
                            player1Id: team.player1Id,
                            player2Id: team.player2Id,
                            player2FName: team.player2FName,
                            player2LName: team.player2LName,
                            player2Phone: team.player2Phone,
                            createdAt: team.createdAt,
                            updatedAt: team.updatedAt
                        },
                        update: {
                            teamName: team.teamName,
                            player1Id: team.player1Id,
                            player2Id: team.player2Id,
                            player2FName: team.player2FName,
                            player2LName: team.player2LName,
                            player2Phone: team.player2Phone,
                            updatedAt: team.updatedAt
                        },
                }))
            );

            return await tx.tournament.findUniqueOrThrow({
              where: { id: tournamentId },
              include: { teams: true },
            });
          });

          const allTeams = TournamentMapper.toDomain(record).teams;
          return allTeams;
        } catch (error) {
          throw new BadRequestException("richiesta non accettata")
        }
  }

  async saveBracket(tournamentId: string, matches: TournamentMatch[]): Promise<TournamentMatch[]> {
    try {
      const savedRecords = await this.prisma.$transaction(async (tx) => {
        await tx.tournamentMatch.deleteMany({
          where: { tournamentId },
        });

        const matchesData = matches.map((match) => TournamentMapper.toTournamentMatchPersistence(match));

        await tx.tournamentMatch.createMany({
          data: matchesData,
        });

        return await tx.tournamentMatch.findMany({
          where: { tournamentId },
          orderBy: [{ round: 'desc' }, { matchOrder: 'asc' }],
        });
      });

      // Riconverte i record di persistenza in entità di dominio
      return savedRecords.map((record) => TournamentMapper.prismaMatchToDomain(record));
    } catch (error) {
      // Logga l'errore internamente se necessario, poi lancia l'eccezione
      throw new BadRequestException('Impossibile salvare il tabellone del torneo');
    }
  }

  async updateMatch(match: TournamentMatch): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
        const matchPrimitives = match.toPrimitives();

        await tx.tournamentMatch.update({
          where: { id: matchPrimitives.id },
          data: {
            courtId: matchPrimitives.courtId,
            status: TournamentMapper.DOMAIN_TO_PRISMA_MATCH_STATUS[matchPrimitives.status],
            team1Id: matchPrimitives.team1Id,
            team2Id: matchPrimitives.team2Id,
            winnerTeamId: matchPrimitives.winnerTeamId,
            round: matchPrimitives.round,
            matchOrder: matchPrimitives.matchOrder,
            format: TournamentMapper.DOMAIN_TO_PRISMA_MATCH_FORMAT[matchPrimitives.format],
            scheduledAt: matchPrimitives.scheduledAt,
            updatedAt: matchPrimitives.updatedAt,
          },
        });
    });
  }

  async updateMatches(matches: TournamentMatch[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const match of matches) {
          await this.updateMatch(match)
      }
    });
  }


  async updateSetsMatch(match: TournamentMatch): Promise<void> {
    const primitives = match.toPrimitives();
    
    const setsData = primitives.score?.value ?? [];

    await this.prisma.$transaction(async (tx) => {
      // 1. Strategia "Sostituzione Atomica": elimina i vecchi set associati a questo match
      await tx.tournamentMatchSet.deleteMany({
        where: { matchId: primitives.id },
      });
       
      // 2. Inserisce i nuovi set derivati dal dominio se ce ne sono
      if (setsData.length > 0) {
        await tx.tournamentMatchSet.createMany({
          data: setsData.map((set) => ({
            matchId: primitives.id,
            setNumber: set.setNumber,
            team1Games: set.team1Games,
            team2Games: set.team2Games,
            tieBreak: set.tieBreak,
          })),
        });
      }

      // 3. Aggiorna il match
      await tx.tournamentMatch.update({
          where: { id: primitives.id },
          data: {
            status: TournamentMapper.DOMAIN_TO_PRISMA_MATCH_STATUS[primitives.status],
            winnerTeamId: primitives.winnerTeamId,
            updatedAt: primitives.updatedAt,
          },
        });
    });

  }



  async RO_tournament_findAll(): Promise<TournamentsResDto[]> {
    const records = await this.prisma.tournament.findMany({
      where: {isVisible: true},
      orderBy: { createdAt: 'asc' },
      select: toTournamentsSelect,
    });
  
    return records.map((record) => TournamentMapper.prismaTournamentsToDto(record));
  }

  async RO_tournament_findById(id: string): Promise<TournamentResDto> {
  
    const record = await this.prisma.tournament.findUnique({
      where: { id, isVisible: true},
      select: toTournamentSelect,
    });
  
    if (!record) {
      throw new NotFoundException("Torneo non trovato");
    }
  
    return TournamentMapper.prismaTournamentToDto(record);
  }


  async RO_match_findAll(idTournament: string, idMatches?: string[]): Promise<TournamentMatchResDto[]>{

    const records = await this.prisma.tournamentMatch.findMany({
      where: {
        tournamentId: idTournament,
        ...(idMatches && idMatches.length > 0 ? { id: { in: idMatches } } : {}),
      },
      select: toMatchDtoSelect,
      orderBy: [ { round: 'asc' }, { matchOrder: 'asc' }]
    });

    return records.map(match => TournamentMapper.PrismaMatchToDto(match));
  }

  async RO_team_findAll(idTournament: string): Promise<TournamentTeamResDto[]>{

    const records = await this.prisma.tournamentTeam.findMany({
      where: {tournamentId: idTournament},
      select: toTeamDtoSelect
    });

    return records.map(match => TournamentMapper.prismaTeamToDto(match));
  }
}