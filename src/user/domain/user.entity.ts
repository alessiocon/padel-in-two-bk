export enum UserRole {
  PLAYER = 'PLAYER',
  CLUB_OWNER = 'CLUB_OWNER',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deleteAt: Date | null;
  
}

// Tipo specifico per i dati richiesti alla creazione
export type CreateUserProps = Omit<UserProps, 'id' | 'updatedAt' | 'deleteAt' | 'role'>;


export class User {
  constructor(private readonly props: UserProps) {}
  private _deletedAt?: Date | null;

  get id(): string { return this.props.id; }
  get email(): string { return this.props.email; }
  get passwordHash(): string { return this.props.passwordHash; }
  get firstName(): string { return this.props.firstName; }
  get lastName(): string { return this.props.lastName; }
  get username(): string { return this.props.username; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get role(): UserRole { return this.props.role; }

  get isDeleted(): boolean { return !!this._deletedAt;}

  static create(props: CreateUserProps): User {
    
    return new User({
      ...props,
      id: crypto.randomUUID(),
      role: UserRole.PLAYER,
      updatedAt: props.createdAt,
      deleteAt: null,
    });
  }

  static reconstitute(props: UserProps): User {
      return new User({ ...props });
  }

  // Restituisce l'oggetto privo di dati sensibili
  toResponse() {
    const { passwordHash, ...safeUser } = this.props;
    return safeUser;
  }

  toPrimitives() {
    const { passwordHash, ...safeUser } = this.props;
    return { ...safeUser };
  }

  delete() {
    if (this._deletedAt) {
      throw new Error('User is already deleted.');
    }
    return new User({...this.props, deleteAt: new Date()})
  }
}