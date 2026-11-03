export interface JwtPayload {
  sub: string;       
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  playerId?: string;
}

export interface AuthTokens {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    role: string;
  };
}