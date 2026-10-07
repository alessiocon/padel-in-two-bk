import { DateTime } from 'luxon';
import { TournamentTeam } from './tournamentTeam.entity.js';
import { BadRequestException } from '@nestjs/common';
import { MatchFormat, MatchStatus, TournamentMatch, TournamentMatchProps } from './tournamentMatch.entity.js';
import { SetScoreProps } from './valueObject/matchScore.value.js';
import { BracketManagerDomainService } from './services/bracket-manager.domain-service.js';

export interface TournamentProps {
  id: string;
  title: string;
  description: string | null;
  position: string;
  municipality: string;
  province: string;
  award: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  maxTeams: number;
  isClosed: boolean;
  isVisible: boolean;
  showTeams: boolean;
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  createdAt: Date;
  updatedAt: Date;
}

export class Tournament {
    private constructor(private props: TournamentProps) {
        Tournament.validate(props);
    }

    public static create(
        props: Omit<TournamentProps, "id" | "isClosed" | "teams" | "matches"| "updateAt">,
        id = crypto.randomUUID(),
    ): Tournament {
        return new Tournament({
            id: id,
            title: props.title,
            description: props.description ?? null,
            position: props.position,
            municipality: props.municipality,
            province: props.province,
            award: props.award,
            startsAt: props.startsAt,
            endsAt: props.endsAt,
            timezone: props.timezone,
            maxTeams: props.maxTeams ?? 8,
            isClosed: false,
            isVisible: props.isVisible,
            showTeams: props.showTeams,
            teams: [],
            matches: [],
            createdAt: props.createdAt,
            updatedAt: props.createdAt
        });
    }
    
    public static convertInTimeZone(listStringTime: string[], timezone: string): Date[] {
        return listStringTime.map(time => {
          const timeZone = DateTime.fromISO(time, { zone: timezone });
          if (!timeZone.isValid) {
            throw new Error(`Invalid tournament date/time format: ${time}`);
          }
          return timeZone.toJSDate();
        });
      }
  public static reconstitute(props: TournamentProps): Tournament {
    return new Tournament(props);
  }

  // Business Logic / Regole di dominio
  public addTeam(team: TournamentTeam): void {
    if (this.props.isClosed) {
      throw new BadRequestException('Cannot add team: Tournament registration is closed.');
    }
    if (this.props.teams.length >= this.props.maxTeams) {
      throw new BadRequestException('Cannot add team: Tournament has reached maximum capacity.');
    }

    // Controllo se un player si è già registrato con un altra squadra
    const playerAlreadyExists = this.props.teams.some((t) => 
        t.player1Id === team.player1Id || t.player1Id === team.player2Id || 
        (team.player2Id !== null && (t.player2Id === team.player1Id || t.player2Id === team.player2Id)));
    if (playerAlreadyExists) {
      throw new BadRequestException(`Uno e entrambi i player sono già registrati per il team ${team.teamName}`);
    }

    const teamAlreadyExists = this.props.teams.some((t) => t.teamName === team.teamName)
    if (teamAlreadyExists) {
      throw new BadRequestException(`Nome Del Team ${teamAlreadyExists} già in uso`);
    }
    

    this.props.teams.push(team);
  }

  public closeRegistration(): void {
    this.props.isClosed = true;
  }

  public updateMatch(input: {
    id: string, 
    courtId?: string | null,
    team1Id?: string| null, 
    team2Id?: string| null,
    format?: string,
    scheduledAt?: Date,
    status?: MatchStatus,
    updatedAt: Date,
  }){

    let match = this.props.matches.find(m => m.id === input.id);
    if(!match){ throw new BadRequestException("Match da modificare non trovato")}

    if(input.status){
      this.chanegStatusMatch(match, input.updatedAt, input.status);
    }

    if(input.team1Id || input.team2Id ){
      if(input.team1Id && !this.props.teams.find(t => t.id === input.team1Id)){
        throw new BadRequestException("Il Team 1 non è iscritto al torneo")
      }

      if(input.team2Id && !this.props.teams.find(t => t.id === input.team2Id)){
        throw new BadRequestException("Il Team 2 non è iscritto al torneo")
      }
     
      let matchesInRound = this.props.matches.filter(m => m.round === match.round && m.id !== input.id);

      let isTeam1Duplicate = input.team1Id ?  Boolean(matchesInRound.find(m => m.team1Id === input.team1Id || m.team2Id === input.team1Id))  : false
      let isTeam2Duplicate = input.team2Id ?  Boolean(matchesInRound.find(m => m.team1Id === input.team2Id || m.team2Id === input.team2Id))  : false

      if(isTeam1Duplicate){throw new BadRequestException("Il Team 1 che hai inserito ha già partecipato a questo round") }
      if(isTeam2Duplicate){throw new BadRequestException("Il Team 2 che hai inserito ha già partecipato a questo round") }

      const team1ToUpdate = input.team1Id === undefined ? match.team1Id :  input.team1Id;
      const team2ToUpdate = input.team2Id === undefined ? match.team2Id :  input.team2Id;

      match.assignTeams(team1ToUpdate, team2ToUpdate, input.updatedAt)
    }

    match.update({courtId: input.courtId, format: match.format, updatedAt: input.updatedAt})
  }

  public recordScore(input: {matchId: string, score: SetScoreProps[], updatedAt: Date}) {
    let match = this.props.matches.find(m => m.id === input.matchId);
    if(!match){ throw new BadRequestException("Match da modificare non trovato")}

    match.recordScore(input.score, match.format ?? MatchFormat.SINGLE_SET , input.updatedAt)
  }

  public nextMatch(input: {matchId: string, updatedAt: Date}) : TournamentMatch{
    let match = this.props.matches.find(m => m.id === input.matchId);
    if(!match){ throw new BadRequestException("Match da modificare non trovato")}
    if(match.status !== MatchStatus.COMPLETED){
      throw new BadRequestException("Competa prima il match inserendo i set")
    }

    const {targetMatch, slot} =  BracketManagerDomainService.getNextMatchSlot(match, this.props.matches);
    if(!targetMatch){
      throw new BadRequestException("Prossimo match insesistente")
    };

    let teams1 = slot === "team1" ? match.winnerTeamId: targetMatch.team1Id
    let teams2 = slot === "team2" ? match.winnerTeamId: targetMatch.team2Id
    if(targetMatch.status !== MatchStatus.SCHEDULED){
      throw new BadRequestException("Il prossimo match è già in corso o competato")
    }

    targetMatch.assignTeams(teams1, teams2, input.updatedAt);
    return targetMatch
  }


  private chanegStatusMatch(match: TournamentMatch, updatedAt: Date, status: MatchStatus){
    const {targetMatch } =  BracketManagerDomainService.getNextMatchSlot(match, this.props.matches);
    let isNextMatchStarted = targetMatch && targetMatch.status !== MatchStatus.SCHEDULED && targetMatch.status !== MatchStatus.CANCELLED;

    if(status === MatchStatus.IN_PROGRESS){
      match.start(updatedAt);
    }

    if(status === MatchStatus.SCHEDULED) {
      if(isNextMatchStarted){
        throw new BadRequestException("Non puoi assegnare lo stato scheduled dato che il prossimo match è già in corso o completato")
      }
      match.schedule(updatedAt);
    }
  }

  // Getters con esplicito ritorno di null ove previsto
  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description;}
  get position(): string { return this.props.position;}
  get municipality(): string { return this.props.municipality;}
  get province(): string { return this.props.province;}
  get award(): string { return this.props.award;}
  get startsAt(): Date { return this.props.startsAt; }
  get endsAt(): Date { return this.props.endsAt; }
  get timezone(): string { return this.props.timezone; }
  get maxTeams(): number { return this.props.maxTeams;}
  get isClosed(): boolean { return this.props.isClosed; }
  get isVisible(): boolean { return this.props.isVisible; }
  get showTeams(): boolean { return this.props.showTeams; }
  get teams(): TournamentTeam[] { return this.props.teams; }
  get matches(): TournamentMatch[] { return this.props.matches; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toPrimitives(): TournamentProps { return { ...this.props } }

  public removeTeam(teamId: string): void {
  if (this.props.isClosed) {
    throw new Error('Cannot modify team: Tournament registration is closed.');
  }

  const index = this.props.teams.findIndex((t) => t.id === teamId);
  if (index === -1) {
    throw new Error('Team not found in tournament.');
  }
  this.props.teams.splice(index, 1);
}

public updateTeamPlayer2(teamId: string, player2Id: string | null, player2FName: string | null, player2LName: string | null, player2Phone: string | null): void {
  if (this.props.isClosed) {
    throw new Error('Cannot modify team: Tournament registration is closed.');
  }
  const team = this.props.teams.find((t) => t.id === teamId);
  if (!team) {
    throw new Error('Team not found in tournament.');
  }
  // Poiché i props sono privati, possiamo esporre un metodo mutatore interno o ricreare/aggiornare l'istanza del Team
  team.updatePlayer2(player2Id, player2FName, player2LName, player2Phone);
}

private static validate(props: TournamentProps): void {
    if (!props.id) {
      throw new Error('Tournament requires a id');
    }
    if (Number.isNaN(props.startsAt.getTime())) {
      throw new Error('Tournament start must be valid');
    }
    if (props.startsAt <= props.updatedAt) {
      throw new Error('Tounament start must be after now');
    }
    if (props.endsAt <= props.startsAt) {
      throw new Error('Tournament end must be after start');
    }
  }






}