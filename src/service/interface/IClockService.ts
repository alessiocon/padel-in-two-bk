
export const CLOCK_SERVICE = Symbol('CLOCK_SERVICE');

export interface IClockService {
    
    now() : Date
}