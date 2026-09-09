export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User ${id} was not found`);
    this.name = 'UserNotFoundError';
  }
}