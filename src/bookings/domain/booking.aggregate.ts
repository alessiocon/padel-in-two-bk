import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { BookingPastDateError } from "./booking-errors.js";
import { BookingTeam, type BookingTeamPlayerInput } from "./entity/booking.team.entity.js";
import { BookingEventType, BookingLogs as BookingLog, BookingLogs } from "./valueObject/booking.log.value.js";
import { BookingMatch, MatchPropose, MatchPropose as MatchProposeStatus } from "./entity/booking.match.entity.js";
import { BookingSetScoreProps } from "./valueObject/booking.score.value.js";
import { MatchFormat } from "../../tournament/domain/tournamentMatch.entity.js";
import { BookingPlayerStatus } from "./entity/booking.player.entity.js";
import { PromotionType } from '../../promotions/domain/promotion-type.js';

export enum BookingStatus { RESERVED = "RESERVED" ,PENDING = "PENDING" ,CONFIRMED = "CONFIRMED" ,CANCELLED = "CANCELLED", IN_PROGRESS = "IN_PROGRESS", END = "END" };
export enum BookingCancBy { USER = "USER" ,CLUB = "CLUB" };
export enum BookingJoinMode { OPEN = "OPEN", APPROVAL_REQUIRED = "APPROVAL_REQUIRED" }

export type BookingProps = {
  readonly id: string;
  readonly clubId: string;
  readonly courtId: string;
  readonly createdById: string;
  readonly createdByStaff: boolean;
  readonly description?: string;
  readonly isPublic?: boolean;
  readonly joinMode?: BookingJoinMode;
  readonly minPlayerLevel?: number | null;
  readonly maxPlayerLevel?: number | null;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly price: number;
  readonly eligiblePromotions?: readonly PromotionType[];
  readonly status: BookingStatus;

  readonly teams: ReadonlyArray<BookingTeam>;
  readonly logs: ReadonlyArray<BookingLog>;
  readonly match?: BookingMatch | null;

  readonly cancBy: BookingCancBy | null;
  readonly cancAt: Date | null;
  readonly cancPostConfirm: boolean | null;
  readonly cancReason: string | null;

  readonly courtSize: number;

  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type UpdateBookingProps = {
  description?: string,
  updateDate: Date
};

export type BookingInitialPlayerInput = {
  playerId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
};

export type BookingInitialTeamInput = {
  teamName: string;
  players: BookingInitialPlayerInput[];
};

export class Booking {
  private constructor(private props: BookingProps) {
    Booking.validate(props);
  }
  static create(
    input: Omit<BookingProps, 'id' | 'updatedAt' | 'cancBy' | 'cancAt' | 'cancPostConfirm' | 'cancReason' | 'logs'>,
    log: {creatorUsername: string, courtName: string, },
    id = crypto.randomUUID(),
  ): Booking {
    if (input.startsAt < input.createdAt) {
        throw new BookingPastDateError(); // Eccezione di dominio custom
    }

    const createLog = BookingLog.bookingCreated({
      bookingId: id,
      createdAt: input.createdAt,
      userId: input.createdById,
      courtName: log.courtName,
      creatorUsername: log.creatorUsername
    })

    return new Booking({
      id,
      clubId: input.clubId,
      courtId: input.courtId,
      createdById: input.createdById,
      createdByStaff: input.createdByStaff,
      description: input.description,
      isPublic: input.isPublic ?? false,
      joinMode: input.joinMode ?? BookingJoinMode.APPROVAL_REQUIRED,
      minPlayerLevel: input.minPlayerLevel ?? null,
      maxPlayerLevel: input.maxPlayerLevel ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      price: input.price,
      eligiblePromotions: input.createdByStaff ? [] : [...(input.eligiblePromotions ?? [])],
      status: input.status,
      teams: input.teams ?? [],
      logs: [createLog],

      cancBy: null,
      cancPostConfirm: null,
      cancReason: null,
      cancAt: null,

      courtSize: input.courtSize,

      createdAt: input.createdAt,
      updatedAt:  input.createdAt
    });
  }

  static reconstitute(props: BookingProps): Booking {
    return new Booking(props);
  }

  get id(): string { return this.props.id; }
  get clubId(): string { return this.props.clubId; }
  get courtId(): string { return this.props.courtId; }
  get createdById(): string {return this.props.createdById}
  get createdByStaff(): boolean {return this.props.createdByStaff}
  get description() : string|undefined {return this.props.description}
  get isPublic(): boolean { return this.props.isPublic ?? false; }
  get joinMode(): BookingJoinMode { return this.props.joinMode ?? BookingJoinMode.APPROVAL_REQUIRED; }
  get minPlayerLevel(): number | null { return this.props.minPlayerLevel ?? null; }
  get maxPlayerLevel(): number | null { return this.props.maxPlayerLevel ?? null; }
  get courtSize() : number {return this.props.courtSize}
  get startsAt(): Date { return new Date(this.props.startsAt); }
  public get teams(): ReadonlyArray<BookingTeam> { return this.props.teams; }
  public get logs(): ReadonlyArray<BookingLog> { return this.props.logs; }
  public get match(): BookingMatch | null | undefined { return this.props.match; }

  get cancBy(): BookingCancBy|null { return this.props.cancBy; }
  get cancPostConfirm(): boolean|null { return this.props.cancPostConfirm; }
  get cancReason(): string|null { return this.props.cancReason; }
  get cancAt(): Date|null { return this.props.cancAt; }

  get endsAt(): Date { return new Date(this.props.endsAt); }
  get price(): number { return this.props.price; }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }
  get eligiblePromotions(): readonly PromotionType[] { return [...(this.props.eligiblePromotions ?? [])]; }

  promotionsToAward(): readonly PromotionType[] {
    return !this.createdByStaff && this.status === BookingStatus.END &&
      this.match?.status === MatchPropose.ACCEPTED && this.cancAt === null
      ? this.eligiblePromotions : [];
  }
  get status(): BookingStatus { return this.props.status; }

  public initializeTeams(
    teamInputs: readonly BookingInitialTeamInput[],
    creatorPlayerId: string | undefined,
    creatorUsername: string,
    creatorIsClubMember: boolean,
    time: Date,
  ): Booking {
    this.validateForManagmentTeam();
    if (this.teams.length > 0) {
      throw new BadRequestException('Le squadre della prenotazione sono già state inizializzate.');
    }

    const logs: BookingLogs[] = [];
    const teams = teamInputs.map((teamInput, teamIndex) => {
      let team = BookingTeam.create({
        bookingId: this.id,
        teamNumber: teamIndex + 1,
        teamName: teamInput.teamName,
      });

      for (const player of teamInput.players) {
        if (creatorIsClubMember && creatorUsername === player.username) {
          throw new BadRequestException('Utilizza un profilo player per partecipare ad una partita');
        }

        const playerInput: BookingTeamPlayerInput = player.playerId
          ? { type: 'REGISTERED', playerId: player.playerId }
          : { type: 'GUEST', firstName: player.firstName ?? 'Ospite', lastName: player.lastName ?? '', phone: player.phone };
        const isCreatorPlayer = player.playerId === creatorPlayerId;
        team = team.addPlayer(playerInput, isCreatorPlayer ? BookingPlayerStatus.ACCEPTED : BookingPlayerStatus.PENDING);

        logs.push(BookingLogs.playerAdded({
          bookingId: this.id,
          userId: this.createdById,
          actorUsername: creatorUsername,
          targetUsername: player.playerId
            ? player.username ?? player.playerId
            : `${player.firstName ?? 'Ospite'} ${player.lastName ?? ''}`.trim(),
          isRegistered: Boolean(player.playerId),
          createdAt: time,
        }));
      }

      return team;
    });

    while (teams.length < 2) {
      const teamNumber = teams.length + 1;
      teams.push(BookingTeam.create({ bookingId: this.id, teamNumber, teamName: `Team ${teamNumber}` }));
    }

    return new Booking({
      ...this.props,
      teams,
      logs: [...this.logs, ...logs],
      updatedAt: time,
    });
  }

  public addTeam(team: BookingTeam, updateAt: Date): Booking {

    this.validateForManagmentTeam();

    return new Booking({
      ...this.props,
      teams: [...this.props.teams, team],
      updatedAt: updateAt,
    });
  }

  public joinPublicBooking(input: { teamId: string; playerId: string; userId: string; username: string; time: Date }): Booking {
    if (!this.isPublic) throw new NotFoundException('Partita pubblica non trovata.');
    if (![BookingStatus.PENDING, BookingStatus.RESERVED, BookingStatus.CONFIRMED].includes(this.status) || this.startsAt <= input.time) {
      throw new BadRequestException('Le iscrizioni a questa partita sono chiuse.');
    }

    const targetTeam = this.teams.find(team => team.id === input.teamId);
    if (!targetTeam) throw new NotFoundException('Squadra non trovata.');
    const activeStatuses = [BookingPlayerStatus.PENDING, BookingPlayerStatus.REQUESTED, BookingPlayerStatus.ACCEPTED];

    if (targetTeam.players.length >= this.courtSize) { throw new ConflictException('La squadra è al completo.') }
    if (this.teams.some(team => team.hasPlayer(input.playerId))) {
      throw new ConflictException('Sei già iscritto o hai già una richiesta in attesa per questa partita.');
    }

    const status = this.joinMode === BookingJoinMode.OPEN ? BookingPlayerStatus.ACCEPTED : BookingPlayerStatus.REQUESTED;
    const teams = this.teams.map(team => {
      let updatedTeam = team;
      for (const player of team.players) {
        if (player.playerId === input.playerId && !activeStatuses.includes(player.status)) {
          updatedTeam = updatedTeam.removePlayer(player.id).team;
        }
      }
      return updatedTeam.id === input.teamId
        ? updatedTeam.addPlayer({ type: 'REGISTERED', playerId: input.playerId }, status)
        : updatedTeam;
    });
    const log = BookingLogs.create({
      bookingId: this.id,
      userId: input.userId,
      eventType: BookingEventType.PLAYER_JOINED,
      message: status === BookingPlayerStatus.ACCEPTED
        ? `${input.username} si è unito alla partita.`
        : `${input.username} ha richiesto di partecipare alla partita.`,
      createdAt: input.time,
    });

    return new Booking({
      ...this.props,
      teams,
      logs: [log, ...this.logs],
      updatedAt: new Date(Math.max(input.time.getTime(), this.updatedAt.getTime() + 1)),
    });
  }

  public reviewPublicJoinRequest(input: { playerRequestId: string; creatorId: string; username: string; accepted: boolean; time: Date }): {
    booking: Booking; teamId: string; playerId: string; status: BookingPlayerStatus;
  } {
    if (!this.isPublic) throw new NotFoundException('Partita pubblica non trovata.');
    if (this.createdById !== input.creatorId) throw new ForbiddenException('Solo il creatore può gestire le richieste.');
    if (![BookingStatus.PENDING, BookingStatus.RESERVED, BookingStatus.CONFIRMED].includes(this.status) || this.startsAt <= input.time) {
      throw new BadRequestException('Le richieste per questa partita sono chiuse.');
    }

    const team = this.teams.find(candidate => candidate.players.some(player => player.id === input.playerRequestId && player.status === BookingPlayerStatus.REQUESTED));
    const request = team?.players.find(player => player.id === input.playerRequestId && player.status === BookingPlayerStatus.REQUESTED);
    if (!team || !request) throw new NotFoundException('Richiesta di partecipazione non trovata o già gestita.');
    if (!request.playerId) throw new BadRequestException('La richiesta non è associata a un giocatore registrato.');

    const updatedTeam = input.accepted ? team.acceptJoinRequest(request.id) : team.removePlayer(request.id).team;
    const status = input.accepted ? BookingPlayerStatus.ACCEPTED : BookingPlayerStatus.REMOVED;
    const log = BookingLogs.create({
      bookingId: this.id,
      userId: input.creatorId,
      eventType: input.accepted ? BookingEventType.PLAYER_JOINED : BookingEventType.REMOVED,
      message: `${input.username} ha ${input.accepted ? 'accettato' : 'rifiutato'} la richiesta di partecipazione di ${request.playerId}.`,
      createdAt: input.time,
    });
    return {
      booking: new Booking({
        ...this.props,
        teams: this.teams.map(candidate => candidate.id === team.id ? updatedTeam : candidate),
        logs: [log, ...this.logs],
        updatedAt: new Date(Math.max(input.time.getTime(), this.updatedAt.getTime() + 1)),
      }),
      teamId: team.id,
      playerId: request.playerId,
      status,
    };
  }

  public withdrawPublicJoinRequest(input: { playerId: string; userId: string; username: string; time: Date }): {
    booking: Booking; teamId: string; playerId: string; status: BookingPlayerStatus;
  } {
    const team = this.teams.find(candidate => candidate.players.some(player => player.playerId === input.playerId && player.status === BookingPlayerStatus.REQUESTED));
    const request = team?.players.find(player => player.playerId === input.playerId && player.status === BookingPlayerStatus.REQUESTED);
    if (!team || !request) throw new NotFoundException('Richiesta in attesa non trovata.');

    const updatedTeam = team.removePlayer(request.id).team;
    const log = BookingLogs.create({
      bookingId: this.id,
      userId: input.userId,
      eventType: BookingEventType.PLAYER_LEFT,
      message: `${input.username} ha ritirato la richiesta di partecipazione.`,
      createdAt: input.time,
    });
    return {
      booking: new Booking({
        ...this.props,
        teams: this.teams.map(candidate => candidate.id === team.id ? updatedTeam : candidate),
        logs: [log, ...this.logs],
        updatedAt: new Date(Math.max(input.time.getTime(), this.updatedAt.getTime() + 1)),
      }),
      teamId: team.id,
      playerId: input.playerId,
      status: BookingPlayerStatus.REMOVED,
    };
  }

  public addPlayerToTeam(
    teamId: string,
    playerInput: BookingTeamPlayerInput,
    time: Date,
    status: BookingPlayerStatus,
    log: {userId: string, actorUsername: string,targetUsername: string, isRegistered: boolean}
  ): Booking {

    this.validateForManagmentTeam();

    const teamIndex = this.props.teams.findIndex((team) => team.id === teamId);
    if (teamIndex === -1) {
      throw new BadRequestException("La squadra indicata non fa parte della prenotazione.");
    }
    if (
      playerInput.type === 'REGISTERED' &&
      this.props.teams.some((team) => team.hasPlayer(playerInput.playerId))
    ) {
      throw new BadRequestException("L'utente fa già parte della prenotazione.");
    }

    const teams = [...this.props.teams];
    teams[teamIndex] = teams[teamIndex].addPlayer(playerInput, status );

    const auditLog = BookingLogs.playerAdded({
      bookingId: this.props.id,
      ...log,
      createdAt: time
    });

    return new Booking({
      ...this.props,
      teams,
      logs: [auditLog, ...this.logs],
      updatedAt: time,
    });
  }

  public removePlayerFromTeam(
    teamId: string,
    playerId: string,
    playerUsername: string,
    creatorId: string,
    creatorUsername: string,
    updatedAt: Date,
  ): Booking {

    this.validateForManagmentTeam();
   
    if (creatorId !== this.props.createdById) {
      throw new BadRequestException("Solo il creatore della prenotazione può rimuovere i partecipanti.");
    }

    const teamIndex = this.props.teams.findIndex((team) => team.id === teamId);
    if (teamIndex === -1) {
      throw new BadRequestException("La squadra indicata non fa parte della prenotazione.");
    }

    const { team, player } = this.props.teams[teamIndex].removePlayer(playerId);
    const guest = player.guestDetails;

    const auditLog = BookingLog.playerRemoved({
      bookingId: this.id,
      userId: creatorId,
      actorUsername: creatorUsername,
      targetName: playerUsername,
      isRegistered: player.playerId !== null,
      createdAt: updatedAt,
    });
    const teams = [...this.props.teams];
    teams[teamIndex] = team;

    return new Booking({
      ...this.props,
      teams,
      logs: [...this.props.logs, auditLog],
      updatedAt,
    });
  }

  public isPlayerOfTeam(playerId: string) : BookingTeam | undefined{

    return this.teams.find(team => team.players.find(player => player.playerId === playerId));
  }

  public addLogs(log: BookingLog[], updateAt: Date): Booking {
    return new Booking({
      ...this.props,
      logs: [...this.props.logs, ...log],
      updatedAt: updateAt,
    });
  }

  public isAcceptedBookingByUser(userId: string, playerId: string, username: string, isAccepted: boolean, updatedAt: Date): Booking {

    this.validateForManagmentTeam();

    if (userId === this.props.createdById) {
      throw new BadRequestException("Il creatore della prenotazione non può accettare o rifiutare la propria prenotazione.");
    }

    const teamIndex = this.props.teams.findIndex((team) => team.hasPlayer(playerId));
    if (teamIndex === -1) {
      throw new BadRequestException("L'utente non fa parte della prenotazione.");
    }

    const teams = [...this.props.teams];
    teams[teamIndex] = teams[teamIndex].isAcceptedByPlayer(playerId, isAccepted);

     const auditLog = BookingLogs.create({
          bookingId: this.id,
          userId: userId,
          eventType: BookingEventType.PLAYER_LEFT,
          message: `${username} ha ${isAccepted ? 'accettato' : 'rifiutato'} la prenotazione.`,
          createdAt: updatedAt,
        });


    return new Booking({
      ...this.props,
      teams,
      logs: [auditLog, ...this.logs],
      updatedAt,
    });
  }


  updateDetails(changes: UpdateBookingProps): Booking {

    return new Booking({
      ...this.props,
      description: changes.description ?? this.description,
      updatedAt: changes.updateDate,
    });
  }

  CancelPrenotation(input : 
    Pick<BookingProps, 'cancAt' | 'cancBy' | 'cancPostConfirm' | 'cancReason' | 'cancAt' | 'status' | 'updatedAt'>, 
    username: string, 
    userId: string)
  : Booking {
      
    const auditLog = BookingLog.prenotationCancelled({
      bookingId: this.id,
      userId: userId,
      actorUsername: username,
      createdAt: input.updatedAt,
    });
    
    return new Booking({
      ...this.props,
      ...input,
      logs: [...this.props.logs, auditLog],
    });
  }
  

  RestorePrenotation(input : 
    Pick<BookingProps, 'cancAt' | 'cancBy' | 'cancPostConfirm' | 'cancReason' | 'cancAt' | 'status' | 'updatedAt'>, 
    username: string, 
    userId: string)
  : Booking {
      
    const auditLog = BookingLog.restorePrenotation({
      bookingId: this.id,
      userId: userId,
      actorUsername: username,
      createdAt: input.updatedAt,
    });
    
    return new Booking({
      ...this.props,
      ...input,
      logs: [...this.props.logs, auditLog],
    });
  }


  acceptPrenotation(userId: string, username: string, time: Date,): Booking {
    if (this.status !== BookingStatus.PENDING) {throw new BadRequestException("La prenotazione non è in attesa")}
    if(this.cancAt !== null) {throw new BadRequestException("La prenotazione non è più disponibile")}
    
    const auditLog = BookingLog.acceptedBooking({
      bookingId: this.id,
      userId: userId,
      actorUsername: username,
      createdAt: time,
    });

    let booking = new Booking({
      ...this.props,
      status: BookingStatus.CONFIRMED,
       logs: [...this.props.logs, auditLog],
      updatedAt: time
    })

    return booking;
  }

  
  startPrenotation(userId: string, username: string, time: Date,): Booking {
    if (this.status !== BookingStatus.CONFIRMED) {throw new BadRequestException("La prenotazione non è in stata prima confermata")}
    if(this.cancAt !== null) {throw new BadRequestException("La prenotazione non è più disponibile")}
    
    this.allPlayerReady();

    const auditLog = BookingLog.startBooking({
      bookingId: this.id,
      userId: userId,
      actorUsername: username,
      createdAt: time,
    });

    let booking = new Booking({
      ...this.props,
      status: BookingStatus.IN_PROGRESS,
       logs: [...this.props.logs, auditLog],
      updatedAt: time
    })

    return booking;
  }


  public AddMatchPropose(input : {
    isStaff: boolean,
    username: string,
    userId: string,
    playerId: string | null,
    format: MatchFormat,
    matches: BookingSetScoreProps[],
    time: Date
  } ): Booking {

    if (this.props.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Chiedere al desk di attivare la gestione del match');
    }

    if(this.match && (this.match.status === MatchPropose.ACCEPTED || this.match.status === MatchPropose.PENDING)) 
      throw new BadRequestException("Rifiuta o annulla, la proposta già in corso");

    this.allPlayerReady();

    let matchStatus = MatchProposeStatus.PENDING;
    let proposeByTeamId: string | undefined= undefined;
    let isOnePlayerOpponentRegistered : boolean = true;

    if(input.isStaff){

      matchStatus = MatchProposeStatus.ACCEPTED;
    }else{

      let team = input.playerId ? this.isPlayerOfTeam(input.playerId)  : undefined;
      if(!team) throw new BadRequestException("Non sei autorizzato a segnare il punteggio");
      let player = team?.players.find(p => p.playerId == input.playerId);

      if(!player || player.status !== BookingPlayerStatus.ACCEPTED) throw new BadRequestException("Autorizza non concessa");

      proposeByTeamId = team.id;

      let opponentTeam = this.teams.find(team => team.id !== proposeByTeamId);
      if(!opponentTeam) throw new BadRequestException("Team avversario non trovato");

      let isOnePlayerOpponentRegistered = opponentTeam.players.find(player => player.playerId);
      matchStatus = isOnePlayerOpponentRegistered ? matchStatus : MatchProposeStatus.ACCEPTED;
    }

    
    let match = BookingMatch.create({
        bookingId: this.id,
        status: matchStatus,
        proposeByTeamId,
        format: input.format,
        createdAt: input.time,
        proposeNumber: (this.match?.proposeNumber || 0) + 1
    }, input.matches , this.match?.id) 


    const auditLog = BookingLog.addMatchPropose({
      bookingId: this.id,
      userId: input.userId,
      username: input.username,
      isStaff: input.isStaff,
      createdAt: input.time,
      sets:input.matches,
    });

    //TODO: assegnare il punteggio se il match è in accepted per via dello staff ma controlla la variabile isOnePlayerOpponentRegistered perché se la squadra avversaria non ha un opponente la registrazione va accettata ma non conteggiata
    
    let bookingStatus = match.status === MatchPropose.ACCEPTED ? BookingStatus.END : this.status;
    let booking = new Booking({
      ...this.props,
      status: bookingStatus,
      updatedAt: input.time,
      match: match,
      logs: [auditLog, ...this.logs]
    })

    return booking;
  }

  public AcceptMatchPropose(input : {
    isStaff: boolean,
    username: string,
    userId: string,
    playerId: string | null,
    isAccepted: boolean,
    time: Date
  } ): Booking {

    if (this.props.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Chiedere al desk di attivare la gestione del match');
    }

    if(!this.match) throw new BadRequestException("Match non trovato");

    if(this.match.status !== MatchProposeStatus.PENDING){
      throw new BadRequestException('non è possibile modificare il match');
    }
  
    if(!input.isStaff){
     
      let team = input.playerId ? this.isPlayerOfTeam(input.playerId)  : undefined;
      if(!team) throw new BadRequestException("Non sei autorizzato a gestire la richiesta");

      if(team.id === this.match.proposeByTeamId){
        throw new BadRequestException("Tocca al team avversario confermare o rifiutare il match");
      }
    }
  
    let newMatch = this.match.acceptOrDeclienPropose(input.isAccepted);

    const auditLog = BookingLog.acceptOrDeclienPropose({
      bookingId: this.id,
      userId: input.userId,
      username: input.username,
      isStaff: input.isStaff,
      isAccepted: input.isAccepted,
      createdAt: input.time,
    });

    let bookingStatus = newMatch.status === MatchPropose.ACCEPTED ? BookingStatus.END : this.status;
    return new Booking({
      ...this.props,
      status: bookingStatus,
      updatedAt: input.time,
      match: newMatch,
      logs: [auditLog, ...this.logs]
    })
  }


  public removeMatchPropose(input: {isStaff: boolean, username: string, userId: string, playerId: string | null, time: Date}) : Booking{
    if(!this.match) throw new BadRequestException("Nessun Match trovato");

    if(!input.isStaff){
      let team = input.playerId ? this.isPlayerOfTeam(input.playerId)  : undefined;
      if(!team) throw new BadRequestException("Player non trovato");

      if(this.match.proposeByTeamId !== team.id){ throw new BadRequestException("Non puoi rimuovere la proposta avversaria") }
      if(this.match.status !== MatchProposeStatus.PENDING){ throw new BadRequestException("Non puoi modificare la richiesta") }
    }

    const auditLog = BookingLog.removeMatchPropose({
      bookingId: this.id,
      userId: input.userId,
      username: input.username,
      isStaff: input.isStaff,
      createdAt: input.time,
    });

    return new Booking({
      ...this.props,
      updatedAt: input.time,
      match: null,
      logs: [auditLog, ...this.logs]
    })
  }

  overlaps(other: Booking): boolean {
      return (
      this.courtId === other.courtId &&
      this.startsAt < other.endsAt &&
      this.endsAt > other.startsAt
    );
  }



  public toPrimitives() { 
    return { 
      ...this.props,
      teams: this.props.teams.map(t => t.toPrimitives()),
      logs: this.props.logs.map(l => l.toPrimitives()),
    }; 
  }

  private static validate(props: BookingProps): void {
    if (!props.clubId || !props.courtId) {
      throw new Error('Booking requires a club and court');
    }
    if (Number.isNaN(props.startsAt.getTime()) || Number.isNaN(props.endsAt.getTime())) {
      throw new Error('Booking dates must be valid');
    }
    if (props.endsAt <= props.startsAt) {
      throw new Error('Booking end must be after start');
    }
    if (!Number.isFinite(props.price) || props.price < 0) {
      throw new Error('Booking price must be a finite non-negative amount');
    }
    if (props.minPlayerLevel != null && (props.minPlayerLevel < 1 || props.minPlayerLevel > 7)) {
      throw new BadRequestException('Il livello minimo deve essere compreso tra 1 e 7.');
    }
    if (props.maxPlayerLevel != null && (props.maxPlayerLevel < 1 || props.maxPlayerLevel > 7)) {
      throw new BadRequestException('Il livello massimo deve essere compreso tra 1 e 7.');
    }
    if (props.minPlayerLevel != null && props.maxPlayerLevel != null && props.minPlayerLevel > props.maxPlayerLevel) {
      throw new BadRequestException('Il livello minimo non può superare il livello massimo.');
    }
  }

  private validateForManagmentTeam(): void {
      if(this.status === BookingStatus.IN_PROGRESS){
        throw new BadRequestException("Il Match è già iniziato non puoi gestire i giocatori in questa fase");
      }

      if(this.status === BookingStatus.CANCELLED){
        throw new BadRequestException("Il Match è chiuso non puoi gestire i giocatori in questa fase");
      }

      if(this.status === BookingStatus.END){
        throw new BadRequestException("Prenotazione chiusa");
      }
  }

  private allPlayerReady(): void{
    const acceptedPlayersCount = this.teams.flatMap(team => team.players ?? [])
      .filter(player => player.status === BookingPlayerStatus.ACCEPTED).length;

      if(acceptedPlayersCount !== this.courtSize){
        throw new BadRequestException("non ci sono abbastanza giocatori per iniziare il match");
      }
  }
}
