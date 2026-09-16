export const ENV_CONFIG = Symbol('ENV_CONFIG');

export type NodeEnv = 'development' | 'test' | 'production';

export type AppEnv = {
  nodeEnv: NodeEnv;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieExpiresIn: number;
};

const normalizeNodeEnv = (value: string | undefined): NodeEnv => {
  const normalized = value ?? 'development';
  if (normalized === 'production' || normalized === 'test' || normalized === 'development') {
    return normalized;
  }
  return 'development';
};

export function getEnv(): AppEnv {
  const nodeEnv = normalizeNodeEnv(process.env.NODE_ENV);
  const portValue = Number(process.env.PORT ?? '3000');

  if (!Number.isInteger(portValue) || portValue <= 0) {
    throw new Error('Missing or invalid env: PORT must be a positive integer.');
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('Missing required env: DATABASE_URL');
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw new Error('Missing required env: JWT_SECRET');
  }

  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h"; // Default to 1 hour if not provided
  if (!jwtExpiresIn) {
    throw new Error('Missing required env: JWT_EXPIRES_IN');
  }

  const cookieExpiresIn : number = Number(process.env.COOKIE_EXPIRES_IN) ?? 86400000;
  if (!cookieExpiresIn) {
    throw new Error('Missing required env: COOKIE_EXPIRES_IN');
  }
  
  return {
    nodeEnv,
    port: portValue,
    databaseUrl,
    jwtSecret,
    jwtExpiresIn,
    cookieExpiresIn: cookieExpiresIn
  };
}
