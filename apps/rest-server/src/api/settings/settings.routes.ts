import type { Routes } from '@api/routes.js';
import { SettingsUseCase } from '@domain/settings/settings.use-case.js';
import { settingsSchema } from './settings.schema.js';

export const SettingsRoutes: Routes = {
  base: '/settings',
  get: {
    endpoint: '',
    schema: { response: { 200: settingsSchema } },
    handler: () => SettingsUseCase.exec(),
  },
};
