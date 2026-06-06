export interface User {
  id: string;
  email: string;
  name: string;
}

export interface UserWithCredentials extends User {
  password: string | null;
  salt: string
};

export interface UserInput extends Omit<User, 'id'> {
  password: string;
}

export interface UpdateUserInput extends Partial<Omit<UserInput, 'email'>> {
  oldPassword?: string;
}
