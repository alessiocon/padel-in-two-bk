export class ClubNotFoundError extends Error {
  constructor(id: string) {
    super(`Club ${id} was not found`);
    this.name = 'ClubNotFoundError';
  }
}

export class ClubConflictError extends Error {
  constructor(name: string) {
    super(`A club named "${name}" already exists`);
    this.name = 'ClubConflictError';
  }
}