export const UserErrors = {
  AlreadyRegistered: { code: 'USR_01', message: 'users.error.existing-email' },
  NotFound: { code: 'USR_02', message: 'users.error.not-found' },
  InvalidOldPassword: { code: 'USR_03', message: 'users.error.invalid-old-password' },
} as const;
