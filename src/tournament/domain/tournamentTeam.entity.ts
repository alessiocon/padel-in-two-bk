import { BadRequestException } from "@nestjs/common";

export interface TournamentTeamProps {
  id: string;
  tournamentId: string;
  teamName: string;
  player1Id: string;
  player2Id: string | null;
  player2FName:string | null;
  player2LName:string | null;
  player2Phone: string | null;
  createdAt: Date;
  updatedAt: Date
}

export class TournamentTeam {
  private constructor(private props: TournamentTeamProps) {
    TournamentTeam.validate(props)
  }

  public static create(
    props: Omit<TournamentTeamProps, 'id'>,
    id = crypto.randomUUID()
  ): TournamentTeam {
    return new TournamentTeam({
      id,
      tournamentId: props.tournamentId,
      teamName: props.teamName,
      player1Id: props.player1Id,
      player2Id: props.player2Id ?? null,
      player2FName: props.player2FName ?? null,
      player2LName: props.player2LName ?? null,
      player2Phone: props.player2Phone ?? null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt
    });
  }

  public static reconstitute(props: TournamentTeamProps): TournamentTeam {
    return new TournamentTeam(props);
  }

  get id(): string {  return this.props.id;}
  get tournamentId(): string {  return this.props.tournamentId;}
  get teamName(): string {  return this.props.teamName;}
  get player1Id(): string {  return this.props.player1Id;}
  get player2Id(): string | null {  return this.props.player2Id;}
  get player2FName(): string | null {  return this.props.player2FName;}
  get player2LName(): string | null {  return this.props.player2LName;}
  get player2Phone(): string | null {  return this.props.player2Phone;}
  get createdAt(): Date {  return this.props.createdAt;}
  get updatedAt(): Date {  return this.props.updatedAt;}
  

  toPrimitives(): TournamentTeamProps { return { ...this.props } }

  private static validate(props: TournamentTeamProps): void {
    if(props.player2Id === null && 
      ( 
        props.player2FName === null || props.player2LName === null || props.player2Phone === null || 
        props.player2FName.trim().length === 0 || props.player2LName.trim().length === 0 || props.player2Phone.trim().length === 0
      )){
        throw new BadRequestException("player 2 non è registrato, quindi valorizzare i campi necessari (nome, cognome, telefono)")
    }
  }

  updatePlayer2(player2Id: string| null, player2FName: string| null, player2LName: string| null, player2Phone: string| null){
    //TODO: DA FARE
  }
}