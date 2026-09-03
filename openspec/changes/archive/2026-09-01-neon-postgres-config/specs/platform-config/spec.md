## Purpose

This capability ensures the backend can connect to Neon PostgreSQL using environment-based configuration while keeping secrets out of source control and supporting a clear development and production configuration model.

## ADDED Requirements

### Requirement: Application configuration is environment-driven
The system SHALL read runtime configuration from environment variables and validated config objects instead of hardcoded values.

#### Scenario: Local development uses environment values
- **WHEN** a developer starts the backend in a local environment
- **THEN** the system SHALL read the database URL and app settings from environment-based configuration and reject missing required values before startup continues.

#### Scenario: Production requires explicit configuration
- **WHEN** the backend starts in production mode without required environment values
- **THEN** the system SHALL fail fast with a clear configuration error instead of starting with unstable defaults.

### Requirement: PostgreSQL connection is configured through Prisma
The system SHALL configure Prisma to use a PostgreSQL database URL sourced from the environment and compatible with Neon Database.

#### Scenario: Neon URL is present
- **WHEN** a valid `DATABASE_URL` is provided for Neon PostgreSQL
- **THEN** Prisma SHALL be able to initialize a connection using that URL without requiring repository changes to the database connection logic.

#### Scenario: Missing database URL is detected
- **WHEN** the environment lacks a configured `DATABASE_URL`
- **THEN** the system SHALL surface a configuration error and prevent startup until the value is restored.

### Requirement: Development settings are separated from secrets
The system SHALL keep secret values such as connection strings and credentials in environment files while using non-sensitive application settings in a separate development configuration file.

#### Scenario: Developer config is loaded
- **WHEN** the backend runs in the development profile
- **THEN** it SHALL load non-sensitive application settings from a development configuration file and keep secrets only in environment variables.

#### Scenario: Secret values are not committed
- **WHEN** the repository is inspected by a developer
- **THEN** secret values SHALL not appear in committed source files, including configuration mocks or app settings files meant for local use.
