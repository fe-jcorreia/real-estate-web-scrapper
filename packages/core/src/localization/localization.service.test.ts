import { expect } from 'chai';
import { Localization } from './localization.service.js';

describe('LocalizationService', () => {
  const firstLanguageDicionary = {
    'users.error.not-found': 'User with id {{userId}} not found.',
    'users.error.invalid-email': 'Invalid email.',
    'global.error.generic': 'An error occured.',
  } as const;

  const secondLanguageDicionary = {
    'users.error.not-found': 'Usuário com id {{userId}} não encontrado.',
    'users.error.invalid-email': 'E-mail inválido.',
    'global.error.generic': 'Ocorreu um erro.',
  } as const;

  before(() => {
    Localization.configure(['en-US', 'pt-BR'], 'en-US', { 'en-US': firstLanguageDicionary, 'pt-BR': secondLanguageDicionary });
  });

  it('should translate for default language', () => {
    expect(Localization.__('users.error.invalid-email')).to.be.eq('Invalid email.');
  });

  it('should replace a value', () => {
    expect(Localization.__('users.error.not-found', { userId: 'u_123abc' })).to.be.eq('User with id u_123abc not found.');
  });

  it('should use fallback if key is not found', () => {
    expect(Localization.__('key.that.does.not.exist')).to.be.eq('An error occured.');
  });
});
