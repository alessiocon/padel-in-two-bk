import { DateTime } from 'luxon';

export enum ClubStatus { ACTIVE = "active", INACTIVE = "inactive" }
export enum CourtStatus { AVAILABLE = "available", RESERVED = "reserved", MAINTENANCE = "maintenance", INACTIVE = "inactive" }

export type ClubCourt = {
  id: string;
  clubId: string;
  name: string;
  status: CourtStatus;
};

export type ClubProps = {
  id: string;
  ownerId: string; 
  name: string;
  email: string;
  status: ClubStatus;
  timezone: string
  slotDurationMinutes: number; 
  openingTime: string;         
  closingTime: string;         
  createdAt: Date;
  updatedAt: Date;
  courts: ClubCourt[];
};

export class Club {
  private constructor(private props: ClubProps) {
    Club.validateName(props.name);
    Club.validateOwnerId(props.ownerId);
    Club.validateClubTime(props.openingTime, props.closingTime, props.slotDurationMinutes);
  }

  static create(
    input: Omit<ClubProps, 'id' | 'status' | 'updatedAt' | 'courts'  >,
    courtCount: number = 1,
    id = crypto.randomUUID(),
  ): Club {

    return new Club({
      id,
      ownerId: input.ownerId,
      name: input.name.trim(),
      email: Club.normalizeEmail(input.email),
      status: ClubStatus.ACTIVE,
      timezone: input.timezone,
      slotDurationMinutes: input.slotDurationMinutes,
      openingTime: input.openingTime,
      closingTime: input.closingTime,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      courts: Array.from({ length: courtCount }, (_, index) => ({
        id: crypto.randomUUID(),
        clubId: id,
        name: `campo ${index + 1}`,
        status: CourtStatus.AVAILABLE,
      })),
    });
  }

  static reconstitute(props: ClubProps): Club {
    return new Club({
      ...props,
      name: props.name.trim(),
      courts: props.courts ?? [],
      slotDurationMinutes: props.slotDurationMinutes ?? 90,
      openingTime: props.openingTime ?? '08:00',
      closingTime: props.closingTime ?? '23:00',
    });
  }

  get id(): string { return this.props.id; }
  get ownerId(): string { return this.props.ownerId; }
  get name(): string { return this.props.name; }
  get email(): string { return this.props.email; }
  get status(): ClubStatus { return this.props.status; }
  get createdAt(): Date { return new Date(this.props.createdAt); }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }
  get courts(): ClubCourt[] { return this.props.courts.map((court) => ({ ...court })); }
  get slotDurationMinutes(): number { return this.props.slotDurationMinutes; }
  get openingTime(): string { return this.props.openingTime; }
  get closingTime(): string { return this.props.closingTime; }
  get timezone(): string { return this.props.timezone;}


  updateTimeClubSchedule(openingTime: string, closingTime: string, slotDurationMinutes: number): void {
    Club.validateClubTime(openingTime, closingTime, slotDurationMinutes);
    this.props.openingTime = openingTime;
    this.props.closingTime = closingTime;
    this.props.slotDurationMinutes = slotDurationMinutes;
    this.touch();
  }

  rename(name: string): void {
    Club.validateName(name);
    this.props.name = name.trim();
    this.touch();
  }

  changeEmail(email: string): void {
    this.props.email = Club.normalizeEmail(email);
    this.touch();
  }

  activate(): void {
    this.props.status = ClubStatus.ACTIVE;
    this.touch();
  }

  deactivate(): void {
    this.props.status = ClubStatus.INACTIVE;
    this.touch();
  }

  toPrimitives(): ClubProps {
    return { ...this.props, courts: this.courts };
  }

  calculateBookingEnd(startsAt: string, slotsCount: number = 1): Date {
    const startInZone = DateTime.fromISO(startsAt, { zone: this.timezone });

    const totalMinutes = this.slotDurationMinutes * slotsCount;
    const endInZone = startInZone.plus({ minutes: totalMinutes });

    return endInZone.toJSDate();
  }

  convertInTimeZone(listStringTime : string[]): Date[] {

    var listTimeZone = listStringTime.map(time => {
      var timeZone = DateTime.fromISO(time, { zone: this.timezone });

      if (!timeZone.isValid) {
        //throw new DomainException('Invalid booking date/time format');
         throw new Error(
          `Invalid booking date/time forma: ${time}`
          );
      }

      return timeZone.toJSDate();
    });

    return listTimeZone;
  }

  validateSlotOperatingHours(startsAt: string, endsAt: string): void {

    const start = DateTime.fromISO(startsAt, { zone: this.timezone });
    const end = DateTime.fromISO(endsAt, { zone: this.timezone });

    const [openH, openM] = this.props.openingTime.split(':').map(Number);
    const [closeH, closeM] = this.props.closingTime.split(':').map(Number);

    const clubOpenTotMinutes = openH * 60 + openM;
    var clubCloseTotMinutes = closeH * 60 + closeM;
    const startTotMinutes = start.hour * 60 + start.minute;
    const endTotMinutes = end.hour * 60 + end.minute;

    if (startTotMinutes < clubOpenTotMinutes) {
      throw new Error(
        `L'orario di inizio (${start.hour}:${start.minute}) precede l'apertura del club (${this.props.openingTime}).`
      );
    }

    if (clubCloseTotMinutes <= clubOpenTotMinutes) { clubCloseTotMinutes += 24 * 60; }

    if (endTotMinutes > clubCloseTotMinutes) {
      throw new Error(
        `L'orario di fine (${end.hour}:${end.minute}) supera la chiusura del club (${this.props.closingTime}).`
      );
    }

    // 3. Controllo Griglia Slot
    const minutesFromOpening = startTotMinutes - clubOpenTotMinutes;
    const slotDuration = this.props.slotDurationMinutes;

    if (minutesFromOpening % slotDuration !== 0) {
      throw new Error(
        `L'orario di inizio non è allineato con gli slot da ${slotDuration} minuti per questo circolo.`
      );
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
//#region GENERAL VALIDATION
  private static validateName(name: string): void {
    if (name.trim().length === 0) {
      throw new Error('Club name cannot be blank');
    }

    if (name.trim().length > 160) {
      throw new Error('Club name cannot exceed 160 characters');
    }
  }

  private static validateOwnerId(ownerId: string): void {
    if (!ownerId || ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }
  }

  private static normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Club email must be valid');
    }
    return normalized;
  }
//#endregion

//#region CLUB TIME VALIDATION 
  private static validateFormatClubTime(openingTime: string, closingTime: string){
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
      throw new Error('Opening and closing times must be in HH:mm format');
    }
  }

  private static validateConsistencyClubTime(openingTime: string, closingTime: string, slotDurationMinutes: number){

    if (slotDurationMinutes <= 0 || slotDurationMinutes % 15 !== 0) {
      throw new Error('Slot duration must be a positive multiple of 15 minutes');
    }

    const [openH, openM] = openingTime.split(':').map(Number);
    const [closeH, closeM] = closingTime.split(':').map(Number);
    
    let startMins = openH * 60 + openM;
    let endMins = closeH * 60 + closeM;

    // Gestione chiusura oltre la mezzanotte (es. apertura 08:00, chiusura 01:00)
    if (endMins <= startMins) { endMins += 24 * 60;}

    const totalOperatingMinutes = endMins - startMins;

    if (totalOperatingMinutes < slotDurationMinutes) {
      throw new Error('Total operating window must be at least as long as a single slot duration');
    }

    // Congruenza tra orario di apertura/chiusura e durata dello slot
    if (totalOperatingMinutes % slotDurationMinutes !== 0) {
      throw new Error(
        `Total operating window (${totalOperatingMinutes} mins) is not evenly divisible by slot duration (${slotDurationMinutes} mins)`,
      );
    }


  }

  private static validateClubTime(
    openingTime: string,
    closingTime: string,
    slotDurationMinutes: number,
  ): void {
   
    this.validateFormatClubTime(openingTime, closingTime);
    this.validateConsistencyClubTime(openingTime, closingTime, slotDurationMinutes)
  }
//#endregion


  private getLocalTimeComponents(date: Date): { hours: number; minutes: number; totalMinutes: number } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone, 
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hours = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const minutes = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);

    return {
      hours,
      minutes,
      totalMinutes: hours * 60 + minutes,
    };
  }

  
}