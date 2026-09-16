import { UserRole } from './../../user/domain/user.entity.js';

export interface JwtPayload {
  sub: string;       
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
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