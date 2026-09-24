export const ENV_CONFIG = Symbol('ENV_CONFIG');

export type NodeEnv = 'development' | 'test' | 'production';

export type AppEnv = {
  nodeEnv: NodeEnv;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieExpiresIn: number;
  smtp_server: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
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

  const smtp_server = process.env.SMTP_SERVER?.trim();
  if (!smtp_server) {
    throw new Error('Missing required env: SMTP_SERVER');
  }

  const smtp_port = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(smtp_port) || smtp_port <= 0) {
    throw new Error('Missing or invalid env: SMTP_PORT must be a positive integer.');
  }

  const smtpSecureValue = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (smtpSecureValue !== 'true' && smtpSecureValue !== 'false') {
    throw new Error('Missing or invalid env: SMTP_SECURE must be "true" or "false".');
  }
  const smtp_secure = smtpSecureValue === 'true';

  const smtp_user = process.env.SMTP_USER?.trim();
  if (!smtp_user) {
    throw new Error('Missing required env: SMTP_USER');
  }

  const smtp_pass = process.env.SMTP_PASS?.trim();
  if (!smtp_pass) {
    throw new Error('Missing required env: SMTP_PASS');
  }

  const smtp_from = process.env.SMTP_FROM?.trim();
  if (!smtp_from) {
    throw new Error('Missing required env: SMTP_FROM');
  }



  
  return {
    nodeEnv,
    port: portValue,
    databaseUrl,
    jwtSecret,
    jwtExpiresIn,
    cookieExpiresIn: cookieExpiresIn,
    smtp_server,
    smtp_port,
    smtp_secure ,
    smtp_user,
    smtp_pass,
    smtp_from,
  };
}
