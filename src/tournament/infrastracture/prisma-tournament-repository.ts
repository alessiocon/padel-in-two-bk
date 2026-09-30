import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { TournamentRepository } from './../domain/tournament-IRepository.js';
import { Tournament } from './../domain/tournament.aggregate.js';
import { TournamentMapper, tournamentSummarySelect } from './prisma-tournament-mapper.js';
import { TournamentTeam } from '../domain/tournamentTeam.entity.js';
import { TournamentsResDto, TournamentResDto } from '../presentation/tournament.dto.js';

@Injectable()
export class PrismaTournamentRepository implements TournamentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tournament> {
    const record = await this.prisma.tournament.findUnique({
      where: { id: id},
      include: { teams: true },
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

//   async save(tournament: Tournament): Promise<void> {
//     const data = {
//       title: tournament.title,
//       description: tournament.description,
//       startsAt: tournament.startsAt,
//       endsAt: tournament.endsAt,
//       maxTeams: tournament.maxTeams,
//       isClosed: tournament.isClosed,
//       createdAt: tournament.createdAt,
//     };

    
//     await this.prisma.$transaction(async (tx) => {
//         await tx.tournament.upsert({
//             where: { id: tournament.id },
//             create: {
//             id: tournament.id,
//             ...data,
//             },
//             update: data,
//         });

//         await Promise.all(
//             tournament.teams.map((team) =>
//             tx.tournamentTeam.upsert({
//                 where: { id: team.id },
//                 create: {
//                 id: team.id,
//                 tournamentId: tournament.id,
//                 teamName: team.teamName,
//                 player1Id: team.player1Id,
//                 player2Id: team.player2Id,
//                 player2FName: team.player2FName,
//                 player2LName: team.player2LName,
//                 player2Phone: team.player2Phone,
//                 createdAt: team.createdAt,
//                 },
//                 update: {
//                 teamName: team.teamName,
//                 player2Id: team.player2Id,
//                 player2FName: team.player2FName,
//                 player2LName: team.player2LName,
//                 player2Phone: team.player2Phone,
//                 },
//             })
//             )
//         );
//     });
//   }

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


   async RO_findAll(): Promise<Omit<TournamentsResDto[], "teams">> {
      const records = await this.prisma.tournament.findMany({
        where: {isVisible: true},
        orderBy: { createdAt: 'asc' },
        select: tournamentSummarySelect,
      });
  
      return records.map((record) => TournamentMapper.toSummaryDto(record));
    }

    async RO_findById(id: string): Promise<TournamentResDto> {

      const record = await this.prisma.tournament.findUnique({
        where: { id: id, isVisible: true},
        include: { teams: {
          include: {
            player1: true,
            player2: true,
          }
        } },
      });

      if (!record) {
        throw new NotFoundException("Torneo non trovato");
      }

      return TournamentMapper.toTournamentWithUserDto(record);
    }
  
}