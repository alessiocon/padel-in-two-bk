import { DateTime } from 'luxon';
import { Court, CourtProps} from './entity/court.entity.js';
import { ClubMember, ClubRole } from './entity/club.member.entity.js';

export enum ClubStatus { ACTIVE = "ACTIVE", INACTIVE = "INACTIVE" }

export type ClubProps = {
  id: string;
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
  members: ClubMember[];
};

export class Club {
  private constructor(private props: ClubProps) {
    Club.validateName(props.name);
    Club.validateMembers(props.members);
    Club.validateClubTime(props.openingTime, props.closingTime, props.slotDurationMinutes);
    Club.validateRacketPrice(props.racketPrice);
    if (props.courts.length <= 0) {
      throw new Error('Total courts cannot be 0');
    }
  }

  static create(
    input: Omit<ClubProps, 'id' | 'status' | 'updatedAt' | 'courts' | 'members'>,
    members: {userId: string, role: ClubRole, permissions: string[]}[],
    slotPrice: number,
    courtsIndoor: number = 1,
    courtsOutdoor: number = 0,
    size: number = 4,
    clubId = crypto.randomUUID(),
  ): Club {
    const indoorCourts = Club.createCourtsEntities(clubId, courtsIndoor, slotPrice,  size, true);
    const outdoorCourts = Club.createCourtsEntities(clubId,courtsOutdoor, slotPrice, size,  false, indoorCourts.length);
    const membersEntites = Club.createMemberEntities(clubId, input.createdAt, members )
    
    const allCourts = [...indoorCourts, ...outdoorCourts];

    return new Club({
      id: clubId,
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
      members: membersEntites,
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
  get name(): string { return this.props.name; }
  get email(): string { return this.props.email; }
  get status(): ClubStatus { return this.props.status; }
  get createdAt(): Date { return new Date(this.props.createdAt); }
  get updatedAt(): Date { return new Date(this.props.updatedAt); }
  get courts(): Court[] { return [...this.props.courts]; }
  get members(): ClubMember[] { return [...this.props.members]; }
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

  addMember(member: ClubMember): void {
    const exists = this.props.members.some(m => m.userId === member.userId);
    if (exists) {
      throw new Error('User is already a member of this club');
    }
    this.props.members.push(member);
    this.touch();
  }
  

  removeMember(userId: string): void {
    const memberIndex = this.props.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) {
      throw new Error('Member not found in this club');
    }
    
    // Evita di rimuovere l'ultimo owner rimasto
    const ownersCount = this.props.members.filter(m => m.role === 'OWNER').length;
    if (this.props.members[memberIndex].role === 'OWNER' && ownersCount <= 1) {
      throw new Error('Cannot remove the last club owner');
    }

    this.props.members.splice(memberIndex, 1);
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
    size: number,
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
        size,
        offsetMinutes: 0,
      });
    });
  }

  private static createMemberEntities(clubId: string, time: Date,  members: {userId: string, role: ClubRole, permissions: string[]}[]): ClubMember[] {
    if (!members) return [];

    return members.map(member => {
      return ClubMember.create({
        clubId,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions,
      }, time);
    })
  }


  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (name.trim().length === 0) throw new Error('Club name cannot be blank');
    if (name.trim().length > 160) throw new Error('Club name cannot exceed 160 characters');
  }

  private static validateMembers(members: ClubMember[]): void {
    if (!members || members.length === 0) {
      throw new Error('A club must have at least one member');
    }
    const hasOwner = members.some(m => m.role === 'OWNER' || m.role === 'MANAGER');
    if (!hasOwner) {
      throw new Error('A club must have at least one owner or manager');
    }
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