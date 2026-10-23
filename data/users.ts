import { Credentials, loadCredentials } from '../support/credentials';

export interface LoginInput {
  username: string;
  password: string;
}

export function validUser(): Credentials {
  return loadCredentials();
}

export function loginDataset(name: string): LoginInput {
  switch (name) {
    case 'wrong password':
      return { username: validUser().username, password: 'Wrong-Password-123' };
    case 'unknown user':
      return { username: `ghost_user_${Date.now()}`, password: 'Whatever-Password-1' };
    case 'empty credentials':
      return { username: '', password: '' };
    default:
      throw new Error(`Unknown login dataset: "${name}"`);
  }
}
