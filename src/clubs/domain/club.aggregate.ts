import { DateTime } from 'luxon';
import { Court, CourtProps} from './court.entity.js';

export enum ClubStatus { ACTIVE = "active", INACTIVE = "inactive" }

export type ClubProps = {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  status: ClubStatus;
  position: string;
  timezone: string;
  racketPrice: number;
  slotDurationMinutes: number; 
  openingTime: string;          
  closingTime: string;          
  createdAt: Date;
  updatedAt: Date;
  courts: Court[];              
};

export class Club {
  private constructor(private props: ClubProps) {
    Club.validateName(props.name);
    Club.validateOwnerId(props.ownerId);
    Club.validateClubTime(props.openingTime, props.closingTime, props.slotDurationMinutes);
    Club.validateRacketPrice(props.racketPrice);
    if (props.courts.length <= 0) {
      throw new Error('Total courts cannot be 0');
    }
  }

  static create(
    input: Omit<ClubProps, 'id' | 'status' | 'updatedAt' | 'courts'>,
    slotPrice: number,
    courtsIndoor: number = 1,
    courtsOutdoor: number = 0,
    clubId = crypto.randomUUID(),
  ): Club {
    const indoorCourts = Club.createCourtsEntities(clubId, courtsIndoor, slotPrice, true);
    const outdoorCourts = Club.createCourtsEntities(clubId,courtsOutdoor, slotPrice, false, indoorCourts.length);
    
    const allCourts = [...indoorCourts, ...outdoorCourts];

    return new Club({
      id: clubId,
      ownerId: input.ownerId,
      name: input.name.trim(),
      email: Club.normalizeEmail(input.email),
      status: ClubStatus.ACTIVE,
      position: input.position,
      timezone: input.timezone,
      racketPrice: input.racketPrice,
      slotDurationMinutes: input.slotDurationMinutes,
      openingTime: input.openingTime,
      closingTime: input.closingTime,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      courts: allCourts,
    });
  }

  static reconstitute(props: ClubProps & { courts: CourtProps[] | Court[] }): Club {
    const courts = props.courts.map(c => 
      c instanceof Court ? c : Court.reconstitute(c)
    );

    return new Club({
      ...props,
      name: props.name.trim(),
      courts,
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
  get courts(): Court[] { return [...this.props.courts]; }
  get slotDurationMinutes(): number { return this.props.slotDurationMinutes; }
  get openingTime(): string { return this.props.openingTime; }
  get closingTime(): string { return this.props.closingTime; }
  get position(): string { return this.props.position; }
  get timezone(): string { return this.props.timezone; }
  get racketPrice(): number { return this.props.racketPrice; }

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


  toPrimitives(): Omit<ClubProps, 'courts'> & { courts: CourtProps[] } {
    return {
      ...this.props,
      courts: this.props.courts.map(c => c.toPrimitives()),
    };
  }

  //TODO:DOVREBBE ESSERE DELL'ENTITY BOOKING
  calculateBookingEnd(startsAt: string, slotsCount: number = 1): Date {
    const startInZone = DateTime.fromISO(startsAt, { zone: this.timezone });
    const totalMinutes = this.slotDurationMinutes * slotsCount;
    return startInZone.plus({ minutes: totalMinutes }).toJSDate();
  }

  convertInTimeZone(listStringTime: string[]): Date[] {
    return listStringTime.map(time => {
      const timeZone = DateTime.fromISO(time, { zone: this.timezone });
      if (!timeZone.isValid) {
        throw new Error(`Invalid booking date/time format: ${time}`);
      }
      return timeZone.toJSDate();
    });
  }


  validateCourtSlot(courtId: string, startsAt: string, endsAt: string): void {
    const court = this.props.courts.find(c => c.id === courtId);
    if (!court) {
      throw new Error(`Court with ID ${courtId} not found in this club.`);
    }
    court.validateSlotOperatingHours(
      startsAt, 
      endsAt, 
      this.timezone, 
      this.openingTime, 
      this.closingTime, 
      this.slotDurationMinutes
    );
  }

  private static createCourtsEntities(
    clubId: string,
    count: number,
    price: number,
    isIndoor: boolean,
    startIndex: number = 0,
  ): Court[] {
    if (!count) return [];

    return Array.from({ length: count }, (_, index) => {
      return Court.create({
        clubId,
        name: `campo ${index + startIndex + 1}`,
        isIndoor,
        price,
        offsetMinutes: 0,
      });
    });
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (name.trim().length === 0) throw new Error('Club name cannot be blank');
    if (name.trim().length > 160) throw new Error('Club name cannot exceed 160 characters');
  }

  private static validateOwnerId(ownerId: string): void {
    if (!ownerId || ownerId.trim().length === 0) throw new Error('Owner ID is required');
  }

  private static normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Club email must be valid');
    }
    return normalized;
  }

  private static validateClubTime(openingTime: string, closingTime: string, slotDurationMinutes: number): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(openingTime) || !timeRegex.test(closingTime)) {
      throw new Error('Opening and closing times must be in HH:mm format');
    }
    if (slotDurationMinutes <= 0 || slotDurationMinutes % 15 !== 0) {
      throw new Error('Slot duration must be a positive multiple of 15 minutes');
    }
  }

  private static validateRacketPrice(slotPrice: number): void {
    if (slotPrice < 0) throw new Error('Price cannot be negative');
    if (slotPrice > 99) throw new Error('The price for a racket can\'t exceed 99');
  }
}