import { DateTime } from 'luxon';

export enum CourtStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  MAINTENANCE = "maintenance",
  INACTIVE = "inactive",
}

export type CourtProps = {
  id: string;
  clubId: string;
  name: string;
  isIndoor: boolean;
  price: number;
  status: CourtStatus;
  offsetMinutes: number;
};

export class Court {
  private constructor(private props: CourtProps) {
    Court.validateName(props.name);
    Court.validatePrice(props.price);
    Court.validateOffset(props.offsetMinutes);
  }

  static create(
    input: Omit<CourtProps, 'id' | 'status' >,
    id = crypto.randomUUID(),
  ): Court {
    return new Court({
      id,
      clubId: input.clubId,
      name: input.name.trim(),
      isIndoor: input.isIndoor,
      price: input.price,
      status: CourtStatus.AVAILABLE,
      offsetMinutes: input.offsetMinutes ?? 0,
    });
  }

  static reconstitute(props: CourtProps): Court {
    return new Court({
      ...props,
      name: props.name.trim(),
      offsetMinutes: props.offsetMinutes ?? 0,
    });
  }

  get id(): string { return this.props.id; }
  get clubId(): string { return this.props.clubId; }
  get name(): string { return this.props.name; }
  get isIndoor(): boolean { return this.props.isIndoor; }
  get price(): number { return this.props.price; }
  get status(): CourtStatus { return this.props.status; }
  get offsetMinutes(): number { return this.props.offsetMinutes; }

  setClubId(clubId: string): void {
    this.props.clubId = clubId;
  }

  updateOffset(offsetMinutes: number): void {
    Court.validateOffset(offsetMinutes);
    this.props.offsetMinutes = offsetMinutes;
  }

  validateSlotOperatingHours(
    startsAt: string, 
    endsAt: string, 
    timezone: string, 
    clubOpeningTime: string, 
    clubClosingTime: string, 
    clubSlotDuration: number
  ): void {
    const start = DateTime.fromISO(startsAt, { zone: timezone });
    const end = DateTime.fromISO(endsAt, { zone: timezone });

    const [openH, openM] = clubOpeningTime.split(':').map(Number);
    const [closeH, closeM] = clubClosingTime.split(':').map(Number);

    let openTotMinutes = openH * 60 + openM + this.props.offsetMinutes;
    let closeTotMinutes = closeH * 60 + closeM;

    if (closeTotMinutes <= openH * 60 + openM) {
      closeTotMinutes += 24 * 60;
    }

    const startTotMinutes = start.hour * 60 + start.minute;
    const endTotMinutes = end.hour * 60 + end.minute;

    if (startTotMinutes < openTotMinutes) {
      throw new Error(`L'orario di inizio precede l'apertura effettiva del campo (${clubOpeningTime} + ${this.props.offsetMinutes}m offset).`);
    }

    if (endTotMinutes > closeTotMinutes) {
      throw new Error(`L'orario di fine supera la chiusura del club (${clubClosingTime}).`);
    }

    const minutesFromOpening = startTotMinutes - openTotMinutes;
    if (minutesFromOpening % clubSlotDuration !== 0) {
      throw new Error(`L'orario di inizio non è allineato con gli slot da ${clubSlotDuration} minuti per questo campo.`);
    }
  }

  toPrimitives(): CourtProps {
    return { ...this.props };
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Court name cannot be blank');
    }
  }

  private static validatePrice(price: number): void {
    if (price < 0) throw new Error('Price cannot be negative');
    if (price > 999) throw new Error('The price for a slot can\'t exceed 999 euros');
  }

  private static validateOffset(offsetMinutes: number): void {
    if (offsetMinutes < 0) {
      throw new Error('Offset minutes cannot be negative');
    }
  }
}