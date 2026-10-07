import { GetTournamentsUseCases } from './all-tournament-use-cases.js';
import { CreateTournamentUseCase } from './create-tournament-use-cases.js';
import { GenerateTournamentBracketUseCase } from './generate-tournament-bracket.use-case.js';
import { GetTournamentUseCases } from './get-tournament-use-cases.js';
import { AssignPointsMatchUseCase } from './assign-point-match-use-cases.js';
import { RegisterTeamsUseCase } from './register-teams-use-cases.js';
import { UpdateMatchUseCase } from './update-match-use-cases.js';
import { NextMatchUseCase } from './next-match-use-cases.js';
import { GetAllMatchUseCases } from './all-match-use-cases.js';
import { GetAllTeamUseCases } from './all-team-use-cases.js';

export const TOURNAMENT_USE_CASES = [
    GetTournamentsUseCases,
    GetTournamentUseCases,
    CreateTournamentUseCase,
    RegisterTeamsUseCase,
    GenerateTournamentBracketUseCase,
    GetAllMatchUseCases,
    GetAllTeamUseCases,
    UpdateMatchUseCase,
    AssignPointsMatchUseCase,
    NextMatchUseCase
  ];