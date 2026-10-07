import { BadRequestException } from '@nestjs/common';
import { MatchScore, SetScoreProps } from './valueObject/matchScore.value.js';


export enum MatchFormat { SINGLE_SET = 'SINGLE_SET', BEST_OF_3 = 'BEST_OF_3'}
export enum MatchStatus { SCHEDULED = 'SCHEDULED', IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED'}

export interface TournamentMatchProps {
  id: string;
  tournamentId: string;
  courtId: string | null;
  team1Id: string | null;
  team2Id: string | null;
  winnerTeamId: string | null;
  round: number;
  matchOrder: number;
  format: MatchFormat;
  status: MatchStatus;
  scheduledAt: Date | null;
  score?: MatchScore | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TournamentMatch {
  private constructor(private props: TournamentMatchProps) {
    TournamentMatch.validate(props);
  }

  public static create(
    props: Omit<TournamentMatchProps, 'id' | 'status' | 'winnerTeamId' | 'updatedAt'>,
    id = crypto.randomUUID()
  ): TournamentMatch {
    const now = new Date();
    return new TournamentMatch({
      id,
      tournamentId: props.tournamentId,
      courtId: props.courtId ?? null,
      team1Id: props.team1Id ?? null,
      team2Id: props.team2Id ?? null,
      winnerTeamId: null,
      round: props.round,
      matchOrder: props.matchOrder,
      format: props.format,
      status: MatchStatus.SCHEDULED,
      scheduledAt: props.scheduledAt ?? null,
      score: props.score ?? null,
      createdAt: props.createdAt,
      updatedAt: props.createdAt,
    });
  }

  public static reconstitute(props: TournamentMatchProps): TournamentMatch {
    return new TournamentMatch(props);
  }

  // --- Regole di Business / Comportamenti ---

  public assignTeams(team1Id: string | null, team2Id: string | null, updatedAt: Date): void {
    if (this.props.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Non è possibile assegnare un team ad un match con stato diverso da scheduled');
    }

    if (team1Id && team2Id && team1Id === team2Id) {
      throw new BadRequestException('A team cannot play against itself.');
    }

    this.props.team1Id = team1Id;
    this.props.team2Id = team2Id;
    this.props.updatedAt = updatedAt;
  }

  public update(input: {courtId?: string | null, format?: MatchFormat, updatedAt: Date}){
    if (input.format !== undefined) {
      this.props.format = input.format;
    }

    if (input.courtId !== undefined) {
      this.props.courtId = input.courtId;
    }

    this.props.updatedAt = input.updatedAt;

  }

  public schedule(updatedAt: Date): void {
    if (this.props.status === MatchStatus.COMPLETED) {
      throw new BadRequestException('Cannot reschedule a completed match.');
    }
    
    if(this.props.score){
      throw new BadRequestException('Non è possibile assegnare scheduled un match con già dei set');
    }

    this.props.scheduledAt = updatedAt;
    this.props.status = MatchStatus.SCHEDULED;
    this.props.updatedAt = updatedAt;
  }


  public start(updatedAt: Date): void {
    if (!this.props.team1Id || !this.props.team2Id) {
      throw new BadRequestException('Cannot start a match without both teams assigned.');
    }
    if (this.props.status !== MatchStatus.SCHEDULED) {
      throw new BadRequestException('Cannot start a match that is already completed.');
    }

    this.props.status = MatchStatus.IN_PROGRESS;
    this.props.updatedAt = updatedAt;
  }

  public recordScore(sets: SetScoreProps[], format: MatchFormat, updatedAt: Date): void {
    if (this.props.status === MatchStatus.CANCELLED) {
      throw new BadRequestException('Cannot record score for a cancelled match.');
    }

    if (!this.props.team1Id || !this.props.team2Id) {
      throw new BadRequestException('Cannot record score without teams assigned.');
    }

    const newScore = MatchScore.create(sets, format);
    const winnerId = newScore.calculateWinner(this.props.team1Id, this.props.team2Id);

    if (!winnerId) {
      throw new BadRequestException('The provided score does not determine a winner for the given match format.');
    }

    this.props.score = newScore;
    this.props.winnerTeamId = winnerId;
    this.props.status = MatchStatus.COMPLETED;
    this.props.updatedAt = updatedAt;
  }


  public cancel(updatedAt: Date,reason?: string): void {
    if (this.props.status === MatchStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed match.');
    }
    this.props.status = MatchStatus.CANCELLED;
    this.props.updatedAt = updatedAt;
  }

  // --- Validazione Interna ---

  private static validate(props: TournamentMatchProps): void {
    if (!props.id) {
      throw new BadRequestException('TournamentMatch requires an id.');
    }
    if (!props.tournamentId) {
      throw new BadRequestException('TournamentMatch requires a tournamentId.');
    }
    if (props.round < 1) {
      throw new BadRequestException('Round must be a positive integer (1 for final, 2 for semi, etc.).');
    }
    if (props.matchOrder < 0) {
      throw new BadRequestException('Match order cannot be negative.');
    }
  }

  // --- Getters ---

  get id(): string { return this.props.id; }
  get tournamentId(): string { return this.props.tournamentId; }
  get courtId(): string | null { return this.props.courtId; }
  get team1Id(): string | null { return this.props.team1Id; }
  get team2Id(): string | null { return this.props.team2Id; }
  get winnerTeamId(): string | null { return this.props.winnerTeamId; }
  get round(): number { return this.props.round; }
  get matchOrder(): number { return this.props.matchOrder; }
  get status(): MatchStatus { return this.props.status; }
  get format(): MatchFormat { return this.props.format; }
  get scheduledAt(): Date | null { return this.props.scheduledAt; }
  get score(): MatchScore | null { return this.props.score ?? null; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public toPrimitives(): TournamentMatchProps {
    return { ...this.props };
  }
}