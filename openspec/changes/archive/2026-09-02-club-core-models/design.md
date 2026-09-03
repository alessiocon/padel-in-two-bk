## Context

See proposal.md - Why. The club domain needs a minimal but durable data model for tenant ownership, court resources, and calendar availability. This design intentionally stays within the club scope and does not yet include user, booking, or payment modeling.

## Goals / Non-Goals

**Goals:**
- model a club as the tenant root
- persist courts as independent resources belonging to a club
- expose a calendar as a derived availability view for a given date/interval
- ensure bookability is computed from real court state

**Non-Goals:**
- user profile and authentication design
- booking lifecycle, reservations, or payment flow
- complex recurrence rules or dynamic pricing logic
- cross-club inventory allocation beyond club-level isolation

## Decisions

### 1. Club as tenant root
The club becomes the root aggregate for all club-owned operational resources. It owns the set of courts and the aggregate availability view for its scheduling context. This reduces the risk of data leakage between clubs and keeps ownership semantics explicit in the database schema.

Alternative considered: treat the calendar as root. Rejected because it would create an independent source of truth and conflict with the requirement that court state is authoritative.

### 2. Court as standalone persisted aggregate
Each court gets its own identity and status and is linked to one club only. This allows maintenance, closure, and inactivity to be tracked without mixing court state into the club aggregate.

Alternative considered: storing a court as a nested object on club. Rejected because it would make status and operational rules harder to query and enforce independently.

### 3. Calendar as derived projection, not source of truth
The calendar should be modeled as a read model or projection over court availability, not a mirror of an independent booking table. The database can still store a calendar snapshot or derived aggregate for performance, but it must always be recomputed from the underlying court state.

Alternative considered: persisting full calendar slots as a separate business entity. Rejected because it would duplicate source-of-truth logic and increase inconsistency risk.

### 4. Minimal schema for phase 1
The initial database design includes:
- `clubs`
- `courts`
- `calendar_slots` or `club_calendar_views`
- `court_status` enum and `calendar_status` enum
- `club_id` foreign keys and uniqueness constraints

This stays intentionally narrow and leaves booking or player-related tables for a later phase.

## Risks / Trade-offs

- [Data duplication risk] → The calendar projection could drift from court state if rebuilt inconsistently; mitigate with strict recomputation and read-model refresh rules.
- [Operational complexity] → Derived availability can be expensive to compute for large date ranges; mitigate by caching only the computed view and keeping the source of truth in courts.
- [Tenant leakage] → Incorrect club scoping could expose court data across clubs; mitigate with unique club_id foreign keys and repository-level filters.

## Migration Plan

1. Create the initial Prisma schema for `Club` and `Court`.
2. Add the calendar projection table limited to club-scope, derived availability data.
3. Add enum constraints for court and calendar states.
4. Validate tenant isolation with migration tests and schema-level constraints.
5. Roll back only by removing the new tables if the domain still needs refinement; no user or booking data should depend on this phase yet.

## Open Questions

- Should the first calendar projection be materialized per day or per slot window? This can be decided based on query patterns after the first availability API is defined.
- Should court availability include a separate `court_availability` table for recurring hours, or is a direct derived view sufficient for v1? This is a design decision for the next iteration and does not change the club-domain boundary.
