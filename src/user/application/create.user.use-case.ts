import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { CLOCK_SERVICE, type IClockService } from "../../service/interface/IClockService.js";
import { type IUserRepository, USER_IREPOSITORY } from "../infrastructure/user.repository.interface.js";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CreateUserDto } from "../presentation/user.dto.js";
import { PasswordHasher } from "../infrastructure/password.hasher.js";
import { User } from "../domain/user.entity.js";
import { userRegisteredEvent } from "../domain/user-events.js";
import { type IPlayerRepository, PLAYER_IREPOSITORY } from "../../player/infrastructure/player-IRepository.js";
import { Player } from "../../player/domain/player.aggregate.js";

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(CLOCK_SERVICE) private readonly clock: IClockService,
    @Inject(USER_IREPOSITORY) private readonly userRepository : IUserRepository,
    @Inject(PLAYER_IREPOSITORY) private readonly playerRepository: IPlayerRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateUserDto) : Promise<User> {
    const passwordHash = await PasswordHasher.hash(dto.password);
    const timeNow = this.clock.now();

    const newUser = User.create({
        email: dto.email,
        passwordHash: passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        username: dto.username,
        phone: dto.phone,
        createdAt: timeNow
    })

    try {
        let user = await this.userRepository.create(newUser);
        const verificationToken = user.id;

        this.eventEmitter.emit('user.registered',
            new userRegisteredEvent(
            newUser.email,
            newUser.firstName,
            newUser.lastName,
            verificationToken
            ),
        );
        return user;

    } catch (error: any) {
      //TODO: il catch così è molto fragile, da sostituire appena si può      
      if (error?.code === 'P2002') {
        const targetField : string= error.meta?.driverAdapterError.cause.constraint.index; // Es. ['email'] o ['username'] o [phone]
        let key = targetField.split("_")[1];
        throw new ConflictException(`${key} già in uso`);
      }
      throw error;
    }
  }
}