import { MatchFormat } from '../../../tournament/domain/tournamentMatch.entity.js';
import { BookingMatchScore } from '../valueObject/booking.score.value.js';

export enum MatchPropose { PENDING = "PENDING", ACCEPTED= "ACCEPTED", DECLINED= "DECLINED"}

export type MatchProposeProps = {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  tieBreak: boolean;
}


export type BookingMatchProps = {
  readonly id:  string;
  readonly bookingId: string; //TODO: PER RISPETTARE IL DDD QUESTO VA ELIMINATO
  readonly score: BookingMatchScore;
  readonly format: MatchFormat;
  readonly proposeByTeamId?: string;           
  readonly status: MatchPropose;
  readonly winnerTeamNumber: number
  readonly proposeNumber: number
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export class BookingMatch {
  private constructor(private readonly props: BookingMatchProps) 
  {
    //QUI POI BISOGNEREBBE VALIDARE TUTTO
  }

  public static create(
    input: Omit<BookingMatchProps, 'id' |'updatedAt' | 'score' | 'winnerTeamNumber'>,
    sets: MatchProposeProps[],
    id : string = crypto.randomUUID(),
  ): BookingMatch {

    const score = BookingMatchScore.create(sets, input.format);
    const winner = score.calculateWinnerTeamNumber();

    return new BookingMatch({
      id,
      bookingId: input.bookingId,
      score: score,
      status: input.status,
      format: input.format,
      proposeByTeamId: input.proposeByTeamId,
      proposeNumber: input.proposeNumber,
      winnerTeamNumber: winner,
      createdAt: input.createdAt,
      updatedAt: input.createdAt
    });
  }

  public get id(): string { return this.props.id; }
  public get bookingId(): string { return this.props.bookingId; }
  public get score(): BookingMatchScore { return this.props.score; }
  public get proposeByTeamId(): string | undefined { return this.props.proposeByTeamId; }
  public get winnerTeamNumber(): number { return this.props.winnerTeamNumber; }
  public get proposeNumber(): number { return this.props.proposeNumber; }
  public get status(): MatchPropose { return this.props.status; }
  public get format(): MatchFormat { return this.props.format; }
  public get createdAt(): Date { return this.props.createdAt; }
  public get updatedAt(): Date { return this.props.updatedAt; }
  

  public acceptOrDeclienPropose(isAccepted: boolean) : BookingMatch {

    const newMatch = BookingMatch.create({
      ...this.props,
      status: isAccepted ? MatchPropose.ACCEPTED : MatchPropose.DECLINED,
    }, [...this.score.value], this.props.id)

    return newMatch;
  }

    public static reconstitute(props: BookingMatchProps): BookingMatch {
      return new BookingMatch(props);
    }


  public toPrimitives() {
    return {
      id:  this.props.id,
      bookingId: this.props.bookingId,
      score: this.props.score,
      format: this.props.format,
      proposeByTeamId: this.props.proposeByTeamId, 
      status: this.props.status,
      winnerTeamNumber: this.props.winnerTeamNumber,
      proposeNumber: this.props.proposeNumber,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  // public get loserTeamNumber(): number {
  //   return this.winnerTeamNumber === 1 ? 2 : 1;
  // }
}