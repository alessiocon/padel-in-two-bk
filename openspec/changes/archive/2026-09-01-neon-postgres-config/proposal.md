## Why

PadelInTwo needs a reliable and secure database configuration layer before the platform can onboard clubs, courts, bookings, and payments at scale. A shared backend must connect to PostgreSQL in Neon without hardcoding connection strings or mixing development settings with production secrets.

## Goals

- Provide a stable PostgreSQL connection for the backend through Neon Database.
- Separate sensitive runtime values from application configuration.
- Support development and production configuration profiles with clear defaults and validation.
- Keep the configuration model consistent with the NestJS + Prisma architecture used by the project.

## Non-goals

- Replacing Prisma with a different ORM.
- Designing a full multi-environment deployment pipeline in this change.
- Introducing database schema changes or new business features beyond configuration and environment readiness.

## What Changes

- Add a backend configuration layer for PostgreSQL connection values and environment validation.
- Introduce a development configuration file for local settings and mock-friendly values.
- Prepare a production-ready configuration contract for environment variables used in run-time deployment.
- Document how secrets and non-sensitive settings are separated for local and hosted environments.

## Capabilities

### New Capabilities
- `platform-config`: backend configuration model for PostgreSQL connection settings, environment validation, and development/production application settings.

### Modified Capabilities
- None

## Impact

- Backend configuration and startup behavior in the NestJS application.
- Prisma connectivity and runtime health checks for Neon PostgreSQL.
- Local developer onboarding, including environment file setup and configuration documentation.
- Operational readiness for future deployment environments without mixing dev and prod settings.
