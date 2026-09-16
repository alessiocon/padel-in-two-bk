import { UserRole } from "../../user/domain/user.entity.js";
import { AuthUserResDto } from "./../presentation/auth.dto.js";

// export interface UserAuthResponse {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   username: string;
//   role: UserRole;
// }

export interface AuthTokens {
  accessToken: string;
  user: AuthUserResDto;
}