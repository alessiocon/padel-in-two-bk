import { TournamentsResDto, TournamentResDto } from '../presentation/tournament.dto.js';
import { Tournament } from './tournament.aggregate.js';
import { TournamentMatch } from './tournamentMatch.entity.js';
import { TournamentTeam } from './tournamentTeam.entity.js';

export const TOURNAMENT_IREPOSITORY = Symbol('TOURNAMENT_REPOSITORY');

export interface TournamentRepository {
  findById(id: string): Promise<Tournament>;
  findAll(): Promise<Tournament[]>;

  create(tournament: Tournament): Promise<Tournament>;
  saveTeams(tournamentId: string, tournament: TournamentTeam[]): Promise<TournamentTeam[]>;
  saveBracket(tournamentId: string, matches: TournamentMatch[]): Promise<TournamentMatch[]>;
  updateMatches(matches: TournamentMatch[]): Promise<void>
  updateSetsMatch(match: TournamentMatch): Promise<void>


  RO_findAll(): Promise<TournamentsResDto[]>;
  RO_findById(id: string): Promise<TournamentResDto>;
//   save(tournament: Tournament): Promise<void>;
}

