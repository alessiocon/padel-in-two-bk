import { IClockService } from "./interface/IClockService.js";

export class ClockService implements IClockService{

    public now(): Date {
        
        return new Date();
    }

}