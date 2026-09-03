## 1. Configuration contract

- [x] 1.1 Define required environment variables for local and production startup, including PostgreSQL/Neon connection values and app runtime settings, and verify the list matches the design decisions.
- [x] 1.2 Add an example environment file for developers and verify it documents required values without exposing secrets.

## 2. Backend integration

- [x] 2.1 Implement the config validation layer for environment variables and verify the app fails fast when required values are missing.
- [x] 2.2 Wire Prisma to the validated `DATABASE_URL` and verify the application boots successfully with a valid Neon connection string.
- [x] 2.3 Add the development appsettings profile for non-sensitive values and verify the config file is loaded correctly in development mode.

## 3. Quality and verification

- [x] 3.1 Add a startup validation check or test that covers missing config and valid config cases, and verify the expected error or success output.
- [x] 3.2 Review local dev workflow and documentation and verify that secrets remain outside the repository while the development appsettings file remains usable for local setup.
