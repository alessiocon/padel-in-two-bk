export enum TokenType {
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  CLUB_INVITATION = "club_invitation",
}

export type TokenProps = {
  id: string;
  tokenHash: string;
  type: TokenType;
  referenceId: string;
  expiresAt: Date;
  createdAt: Date;
};

export class Token {
  private constructor(private props: TokenProps) {
    Token.validateTokenHash(props.tokenHash);
    Token.validateReferenceId(props.referenceId);
    Token.validateExpiresAt(props.expiresAt);
  }


    static create(
        input: Omit<TokenProps, 'id' >,
        id = crypto.randomUUID(),
    ): Token {

    return new Token({
      id,
      tokenHash: input.tokenHash.trim(),
      type: input.type,
      referenceId: input.referenceId.trim(),
      expiresAt: input.expiresAt,
      createdAt: input.createdAt,
    });
  }

  static reconstitute(props: TokenProps): Token {
    return new Token({
      ...props,
      tokenHash: props.tokenHash.trim(),
      referenceId: props.referenceId.trim(),
    });
  }

  // Getters immutabili
  get id()          :string     { return this.props.id;}
  get tokenHash()   :string     { return this.props.tokenHash; }
  get type()        :TokenType  { return this.props.type; }
  get referenceId() :string     { return this.props.referenceId; }
  get expiresAt()   :Date       { return new Date(this.props.expiresAt); }
  get createdAt()   :Date       { return new Date(this.props.createdAt); }

  
  isExpired(currentDate: Date = new Date()): boolean {
    return currentDate.getTime() > this.props.expiresAt.getTime();
  }

 
  toPrimitives(): TokenProps {
    return { ...this.props };
  }

  private static validateTokenHash(tokenHash: string): void {
    if (!tokenHash || tokenHash.trim().length === 0) {
      throw new Error("Token hash cannot be blank");
    }
  }

  private static validateReferenceId(referenceId: string): void {
    if (!referenceId || referenceId.trim().length === 0) {
      throw new Error("Reference ID is required for the token");
    }
  }

  private static validateExpiresAt(expiresAt: Date): void {
    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      throw new Error("Invalid expiration date format");
    }
  }
}