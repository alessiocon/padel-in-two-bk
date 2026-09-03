import { readFileSync } from 'node:fs';

export type AppSettings = {
  app: {
    name: string;
    environment: 'development' | 'production';
  };
  api: {
    cors: {
      enabled: boolean;
      allowedOrigins: string[];
    };
  };
  database: {
    pool: {
      min: number;
      max: number;
    };
  };
};

const resolveConfigFile = (): URL => {
  const environment = (process.env.NODE_ENV ?? 'development').toLowerCase();
  const selectedEnvironment = environment === 'production' ? 'production' : 'development';

  return new URL(`../../config/appsettings.${selectedEnvironment}.json`, import.meta.url);
};

export function loadAppSettings(): AppSettings {
  const configPath = resolveConfigFile();

  try {
    const raw = readFileSync(configPath, 'utf8');
    return JSON.parse(raw) as AppSettings;
  } catch {
    const fallback = new URL('../../config/appsettings.development.json', import.meta.url);
    const raw = readFileSync(fallback, 'utf8');
    return JSON.parse(raw) as AppSettings;
  }
}
