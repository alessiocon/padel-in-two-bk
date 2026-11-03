import { BadRequestException } from '@nestjs/common';

export enum ClubRole { OWNER = 'OWNER', MANAGER = 'MANAGER', COACH = 'COACH', STAFF = 'STAFF'}

export type ClubMemberProps = {
  readonly id: string;
  readonly userId: string;
  readonly clubId: string;
  readonly role: ClubRole;
  readonly permissions: string[]; // Usare sempre il tipo primitivo 'string[]' anziché 'String[]'
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export class ClubMember {
  private constructor(private readonly props: ClubMemberProps) {
    ClubMember.validate(props);
  }

  public static create(
    input: Omit<ClubMemberProps, 'id' | 'createdAt' | 'updatedAt'>,
    time: Date,
    id: string = crypto.randomUUID(),
  ): ClubMember {
    return new ClubMember({
      id,
      userId: input.userId,
      clubId: input.clubId,
      role: input.role,
      permissions: [...input.permissions], // Copia difensiva dell'array
      createdAt: time,
      updatedAt: time,
    });
  }

  public static reconstitute(props: ClubMemberProps): ClubMember {
    return new ClubMember(props);
  }

  public get id(): string { return this.props.id; }
  public get userId(): string { return this.props.userId; }
  public get clubId(): string { return this.props.clubId; }
  public get role(): ClubRole { return this.props.role; }
  public get permissions(): string[] { return [...this.props.permissions]; } // Restituisce una copia per evitare mutazioni esterne
  public get createdAt(): Date { return new Date(this.props.createdAt); }
  public get updatedAt(): Date { return new Date(this.props.updatedAt); }

  public updateRole(role: ClubRole): void {
    if (!Object.values(ClubRole).includes(role)) {
      throw new BadRequestException(`Invalid club role: ${role}`);
    }
    //TODO: DA CREARE LA LOGICA
    // Se avessi props mutabili potresti aggiornare, oppure ricreare/gestire l'immutabilità
  }

  public toPrimitives(): ClubMemberProps {
    return {
      id: this.props.id,
      userId: this.props.userId,
      clubId: this.props.clubId,
      role: this.props.role,
      permissions: [...this.props.permissions],
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
    };
  }

  private static validate(props: ClubMemberProps): void {
    if (!props.id || props.id.trim().length === 0) {
      throw new BadRequestException('ClubMember ID cannot be empty');
    }
    if (!props.userId || props.userId.trim().length === 0) {
      throw new BadRequestException('UserId is required for a club member');
    }
    if (!props.clubId || props.clubId.trim().length === 0) {
      throw new BadRequestException('ClubId is required for a club member');
    }
    if (!Object.values(ClubRole).includes(props.role)) {
      throw new BadRequestException('Invalid club role specified');
    }
  }
}