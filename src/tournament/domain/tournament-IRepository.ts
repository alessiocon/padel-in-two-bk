import { TournamentsResDto, TournamentResDto, TournamentMatchResDto, TournamentTeamResDto } from '../presentation/tournament.dto.js';
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
  updateMatch(matches: TournamentMatch): Promise<void>
  updateMatches(matches: TournamentMatch[]): Promise<void>
  updateSetsMatch(match: TournamentMatch): Promise<void>


  RO_tournament_findAll(): Promise<TournamentsResDto[]>;
  RO_tournament_findById(id: string): Promise<TournamentResDto>;
  RO_match_findAll(idTournament: string, idMatches?: string[]): Promise<TournamentMatchResDto[]>
  RO_team_findAll(idTournament: string): Promise<TournamentTeamResDto[]>
}

