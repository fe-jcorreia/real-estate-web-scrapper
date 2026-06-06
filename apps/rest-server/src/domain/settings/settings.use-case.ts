import type { Settings } from '@domain/model/settings.model.js';

async function exec(): Promise<Settings> {
  return {
    forceUpdate: {
      // Create a datasource here to retrive the data
      android: { latest: 20, required: 10 },
      ios: { latest: 20, required: 10 },
    },
  };
}

export const SettingsUseCase = { exec };
