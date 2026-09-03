export type ClubStatus = 'active' | 'inactive';

export type ClubCourt = {
  id: string;
  clubId: string;
  name: string;
  status: 'available' | 'reserved' | 'maintenance' | 'inactive';
};

export type ClubProps = {
  id: string;
  name: string;
  email: string;
  status: ClubStatus;
  createdAt: Date;
  updatedAt: Date;
  courts: ClubCourt[];
};

export class Club {
  private constructor(private props: ClubProps) {
    Club.validateName(props.name);
  }

  static create(name: string, email: string, id = crypto.randomUUID(), courtCount = 0): Club {
    if (!Number.isInteger(courtCount) || courtCount <= 0) {
      throw new Error('Court count must be a positive integer');
    }
    const now = new Date();

    return new Club({
      id,
      name: name.trim(),
      email: Club.normalizeEmail(email),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      courts: Array.from({ length: courtCount }, (_, index) => ({
        id: crypto.randomUUID(),
        clubId: id,
        name: `campo ${index + 1}`,
        status: 'available',
      })),
    });
  }

  static reconstitute(props: ClubProps): Club {
    return new Club({ ...props, name: props.name.trim(), courts: props.courts ?? [] });
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get status(): ClubStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get courts(): ClubCourt[] {
    return this.props.courts.map((court) => ({ ...court }));
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
    this.props.status = 'active';
    this.touch();
  }

  deactivate(): void {
    this.props.status = 'inactive';
    this.touch();
  }

  toPrimitives(): ClubProps {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (name.trim().length === 0) {
      throw new Error('Club name cannot be blank');
    }

    if (name.trim().length > 160) {
      throw new Error('Club name cannot exceed 160 characters');
    }
  }

  private static normalizeEmail(email: string): string {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Club email must be valid');
    }
    return normalized;
  }
}