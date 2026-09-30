import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TOURNAMENT_IREPOSITORY, type TournamentRepository } from '../domain/tournament-IRepository.js';
import { TournamentTeam } from '../domain/tournamentTeam.entity.js';
import { CLOCK_SERVICE, type IClockService } from '../../service/interface/IClockService.js';


export interface TeamInputDto {
  teamName: string;
  player1Id: string;
  player2Id: string | null;
  player2FName: string | null;
  player2LName: string | null;
  player2Phone: string | null;
}

export interface TeamsInputDto {
  tournamentId: string;
  teams: TeamInputDto[];
}

@Injectable()
export class RegisterTeamsUseCase {
  constructor(
    @Inject(TOURNAMENT_IREPOSITORY) private readonly tournamentRepository: TournamentRepository,
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
  ) {}

  async execute(input: TeamsInputDto): Promise<TournamentTeam[]> {
    
    const tournament = await this.tournamentRepository.findById(input.tournamentId);
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${input.tournamentId} not found.`);
    }
    //TODO: QUANDO QUESTA API SARà APERTA AL PUBLICO, BISOGNERà VERIFICARE SE TUTTI GLI UTENTI SONO VERIFICATI, E IL NOME DEL TEAM NON SI RIPETE NELLO STESSO EVENTO
    
    const time = this.clock.now(); 

    for (const teamData of input.teams) {
      const newTeam = TournamentTeam.create({
        tournamentId: tournament.id,
        teamName: teamData.teamName,
        player1Id: teamData.player1Id,
        player2Id: teamData.player2Id ?? null,
        player2FName: teamData.player2FName ?? null,
        player2LName: teamData.player2LName ?? null,
        player2Phone: teamData.player2Phone ?? null,
        createdAt: time,
        updatedAt: time
      });

      tournament.addTeam(newTeam);
    }
    return await this.tournamentRepository.saveTeams(tournament.id, tournament.teams);
  }
}