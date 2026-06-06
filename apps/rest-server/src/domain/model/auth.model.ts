import type { User } from './users.model.js';

export interface AuthInput {
  email: string;
  password: string;
}

export interface Auth {
  token: string;
  user: User;
}

export interface JwtPayload {
  id: string;
}
