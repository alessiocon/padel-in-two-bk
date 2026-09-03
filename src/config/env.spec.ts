import { describe, it, expect, beforeEach, vi } from 'vitest';

const loadModule = async () => {
  const mod = await import('./env.js');
  return mod;
};

describe('config/env', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.JWT_SECRET;
    vi.resetModules();
  });

  it('should require DATABASE_URL and fail fast when missing', async () => {
    process.env.NODE_ENV = 'development';

    const { getEnv } = await loadModule();

    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it('should return normalized environment values when valid', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://user:pass@ep-abc.us-east-2.aws.neon.tech/neondb?sslmode=require';
    process.env.PORT = '3001';
    process.env.JWT_SECRET = 'super-secret';

    const { getEnv } = await loadModule();
    const env = getEnv();

    expect(env.nodeEnv).toBe('development');
    expect(env.port).toBe(3001);
    expect(env.databaseUrl).toContain('postgresql://');
    expect(env.jwtSecret).toBe('super-secret');
  });
});
