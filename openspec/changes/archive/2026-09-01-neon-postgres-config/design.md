## Context

The project currently ships as a NestJS backend with Prisma as the ORM and PostgreSQL/Neon as the target database platform. The repository has no operational configuration layer yet, which makes local startup, environment validation, and deployment readiness harder to manage.

## Goals / Non-Goals

**Goals:**
- Standardize the runtime config contract for the backend.
- Keep database secrets outside the codebase.
- Support clearly separated development and production settings.

**Non-Goals:**
- Changing the database technology.
- Introducing a new ORM or replacing existing Prisma setup.
- Defining production deployment automation or infrastructure provisioning in this change.

## Decisions

### Decision: Environment variables are the source of truth for secrets
The backend SHALL read sensitive values such as `DATABASE_URL`, service secrets, and runtime settings from environment variables. This avoids committing real credentials and aligns with Prisma and Neon best practices.

**Alternatives considered:**
- Hardcoded values in code: rejected because it breaks security and portability.
- Storing configuration in source-controlled JSON files: rejected because it mixes secrets with non-sensitive config and complicates deployment.

### Decision: Development config is a separate non-sensitive profile
A dedicated `appsettings.development.json` file will hold local non-sensitive values such as app defaults, feature toggles, and mock-friendly configuration. Secrets remain in `.env` or `.env.local`.

**Alternatives considered:**
- One global `appsettings.json` file for all environments: rejected because it blurs environment boundaries.
- Putting everything in `.env`: rejected because it creates a single bucket for both secret and non-secret configuration.

### Decision: Validation happens before the app starts
The configuration layer SHALL fail fast when required values are missing. This avoids partial runtime state and makes startup issues visible immediately.

**Alternatives considered:**
- Silent fallback to empty strings: rejected because it hides operational problems until runtime failures occur.
- Lazy validation in service constructors: rejected because it delays discovery and makes debugging harder.

### Decision: Prisma remains the sole DB access contract
Prisma will continue to own database connectivity, and the configuration layer will provide a valid `DATABASE_URL` string without creating a parallel database abstraction.

**Alternatives considered:**
- Custom database helpers in the app layer: rejected because it duplicates Prisma responsibilities and weakens the single source of truth.

## Risks / Trade-offs

- [Configuration drift between environments] → Mitigation: explicit validation and documented env contract.
- [Developers forgetting to create local env files] → Mitigation: `.env.example` and bootstrap documentation.
- [Misplaced secret values in non-sensitive config] → Mitigation: naming discipline, config validation, and code review rules.

## Migration Plan

1. Add environment variable contract and validation layer.
2. Configure Prisma to use `DATABASE_URL` from the environment.
3. Add the development appsettings profile file for non-sensitive settings.
4. Validate startup behavior with local environment values and missing-config checks.
5. Document the expected developer setup for Neon, env files, and local app settings.

## Open Questions

- Whether the project will use `.env` only or `.env.local` plus `.env.example` as the standard developer convention.
- Whether the app configuration file should be stored under the repo root or under a dedicated `config/` folder.
