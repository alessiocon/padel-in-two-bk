import { describe, expect, it } from 'vitest';
import { Club, ClubStatus } from './club.js';

describe('Club aggregate', () => {
  it('creates an active club with a generated identity', () => {
    const club = Club.create('  Padel Milano  ', ' INFO@PadelMilano.it ', crypto.randomUUID(), 2);

    expect(club.id).toEqual(expect.any(String));
    expect(club.name).toBe('Padel Milano');
    expect(club.email).toBe('info@padelmilano.it');
    expect(club.status).toBe(ClubStatus.ACTIVE);
    expect(club.courts.map((court) => court.name)).toEqual(['campo 1', 'campo 2']);
  });

  it('rejects blank names', () => {
    expect(() => Club.create('   ', 'info@padelmilano.it', crypto.randomUUID(), 1)).toThrow('Club name cannot be blank');
  });

  it('requires and normalizes a valid email', () => {
    const club = Club.create('Padel Milano', ' INFO@PadelMilano.it ', crypto.randomUUID(), 1);

    expect(club.email).toBe('info@padelmilano.it');
    expect(() => Club.create('Padel Milano', 'invalid-email', crypto.randomUUID(), 1)).toThrow('Club email must be valid');
  });

  it('rejects clubs without a positive integer court count', () => {
    expect(() => Club.create('Padel Milano', 'info@padelmilano.it', crypto.randomUUID(), 0)).toThrow('Court count must be a positive integer');
    expect(() => Club.create('Padel Milano', 'info@padelmilano.it', crypto.randomUUID(), -1)).toThrow('Court count must be a positive integer');
    expect(() => Club.create('Padel Milano', 'info@padelmilano.it', crypto.randomUUID(), 1.5)).toThrow('Court count must be a positive integer');
  });

  it('allows explicit valid status transitions', () => {
    const club = Club.create('Padel Milano', 'info@padelmilano.it', crypto.randomUUID(), 1);

    club.deactivate();
    expect(club.status).toBe(ClubStatus.INACTIVE);

    club.activate();
    expect(club.status).toBe(ClubStatus.ACTIVE);
  });
});