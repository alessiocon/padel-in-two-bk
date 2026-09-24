export class userRegisteredEvent {
  constructor(
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly verificationToken: string,
  ) {}
}

export class userForgotPasswordEvent {
  constructor(
    public readonly email: string,
    public readonly token: string
  ) {}
}