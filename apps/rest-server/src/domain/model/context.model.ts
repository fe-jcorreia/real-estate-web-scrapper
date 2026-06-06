export interface UnauthenticatedContext {
  uuid: string;
}

export interface AuthenticatedContext extends UnauthenticatedContext {
  userId: string;
}

export type ServerContext = UnauthenticatedContext | AuthenticatedContext;
