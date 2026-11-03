import { AuthUserResDto } from "./../presentation/auth.dto.js";
import { JwtPayload } from "./jwt-payload.interface.js";


export interface AuthTokens {
  accessToken: string;
  user: JwtPayload;
}