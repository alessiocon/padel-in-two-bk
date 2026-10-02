import { GetTournamentsUseCases } from './all-tournament-use-cases.js';
import { CreateTournamentUseCase } from './create-tournament-use-cases.js';
import { GenerateTournamentBracketUseCase } from './generate-tournament-bracket.use-case.js';
import { GetTournamentUseCases } from './get-tournament-use-cases.js';
import { EndMatchUseCase } from './end-match-use-cases.js';
import { RegisterTeamsUseCase } from './register-teams-use-cases.js';
import { UpdateMatchUseCase } from './update-match-use-cases.js';
import { NextMatchUseCase } from './next-match-use-cases.js';


// @Injectable()
// export class RemoveTeamUseCase {
//   constructor(
//     @Inject(TOURNAMENT_IREPOSITORY)
//     private readonly tournamentRepository: TournamentRepository,
//   ) {}

//   async execute(tournamentId: string, teamId: string): Promise<void> {
//     const tournament = await this.tournamentRepository.findById(tournamentId);
//     if (!tournament) {
//       throw new NotFoundException(`Tournament with ID ${tournamentId} not found.`);
//     }

//     // Filtriamo via la squadra dall'array interno del dominio
//     const teamExists = tournament.teams.some((t) => t.id === teamId);
//     if (!teamExists) {
//       throw new NotFoundException(`Team with ID ${teamId} not found in this tournament.`);
//     }

//     // Ricostruiamo o modifichiamo lo stato pulito delle squadre
//     const updatedTeams = tournament.teams.filter((t) => t.id !== teamId);
    
//     // Assegnazione pulita sfruttando reconstitute o metodi dedicati sull'Aggregate
//     // In alternativa, salviamo direttamente rimuovendo il record tramite repository o aggiornando l'aggregate.
//     // Per completezza pulita, possiamo fare in modo che il repository gestisca la cancellazione o aggiorniamo le proprietà.
    
//     // Nota: Poiché l'array teams è read-only nell'entità, possiamo aggiungere un metodo removeTeam nell'Aggregate o gestirlo pulitamente.
//     // Vediamo sotto come estendere l'Aggregate se serve la rimozione nativa.
//   }
// }


// export interface UpdateTeamPlayerDto {
//   tournamentId: string;
//   teamId: string;
//   player2Id: string | null;
//   player2FName: string | null;
//   player2LName: string | null;
//   player2Phone: string | null;
// }

// @Injectable()
// export class UpdateTeamPlayerUseCase {
//   constructor(
//     @Inject(TOURNAMENT_IREPOSITORY)
//     private readonly tournamentRepository: TournamentRepository,
//   ) {}

//   async execute(dto: UpdateTeamPlayerDto): Promise<void> {
//     const tournament = await this.tournamentRepository.findById(dto.tournamentId);
//     if (!tournament) {
//       throw new NotFoundException(`Tournament with ID ${dto.tournamentId} not found.`);
//     }

//     // Eseguiamo il cambio tramite logica di dominio
//     tournament.updateTeamPlayer2(
//       dto.teamId,
//       dto.player2Id ?? null,
//       dto.player2FName ?? null,
//       dto.player2LName ?? null,
//       dto.player2Phone ?? null,
//     );

//     // await this.tournamentRepository.save(tournament);
//   }
// }

export const TOURNAMENT_USE_CASES = [
    GetTournamentsUseCases,
    GetTournamentUseCases,
    CreateTournamentUseCase,
    RegisterTeamsUseCase,
    GenerateTournamentBracketUseCase,
    UpdateMatchUseCase,
    EndMatchUseCase,
    NextMatchUseCase
  ];