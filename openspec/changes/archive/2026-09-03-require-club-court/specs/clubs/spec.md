## MODIFIED Requirements

### Requirement: Club owns its sports resources
The system SHALL model every club as the root aggregate for its sports infrastructure, including at least one court and any future operating hours or resource availability.

#### Scenario: Tenant isolation
- **WHEN** multiple clubs coexist in the platform
- **THEN** the system SHALL ensure that each club's resource set is isolated from every other club and SHALL NOT allow cross-club calendar or court visibility.

#### Scenario: Club requires a court
- **WHEN** a client requests creation of a club
- **THEN** the request SHALL include a positive integer `courtCount` greater than zero and the system SHALL create that number of courts associated with the new club.

#### Scenario: Zero-court club rejected
- **WHEN** a client requests creation of a club with a missing, zero, negative, fractional, or otherwise invalid `courtCount`
- **THEN** the system SHALL reject the request with HTTP `400` and SHALL NOT persist the club.

### Requirement: Persistence of club domain entities
The system SHALL persist the core club domain in dedicated relational tables, with explicit ownership and state tracking for each club-owned resource, and SHALL create a club and its required courts atomically.

#### Scenario: Club record creation
- **WHEN** a new club is created with a valid name and positive `courtCount`
- **THEN** the system SHALL store a unique club record with an identifier, business name, status, creation metadata, and exactly `courtCount` associated courts.

#### Scenario: Court ownership
- **WHEN** a court is created for a club
- **THEN** the system SHALL attach it to exactly one club through a foreign key relationship and SHALL prevent cross-club ownership.

#### Scenario: Atomic club and court creation
- **WHEN** creation of the club or any requested court fails
- **THEN** the system SHALL roll back the complete operation so that neither the partial club nor partial courts remain persisted.

#### Scenario: Existing orphan clubs
- **WHEN** the system is deployed against data containing clubs without courts
- **THEN** the deployment SHALL identify those records and SHALL apply an explicitly defined remediation or block policy before claiming that the no-orphan invariant holds for all existing data.

#### Scenario: Calendar projection scope
- **WHEN** a calendar is evaluated for a club
- **THEN** the system SHALL return only records belonging to that club and SHALL ensure the result is scoped to the owning tenant.
