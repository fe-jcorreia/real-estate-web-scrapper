import i18next from 'i18next';

export const Localization = {
  __: i18next.t,

  configure<TLocale extends string, TKey extends string>(
    supportedLocales: TLocale[],
    defaultLocale: TLocale,
    localizationDicionaries: Record<TLocale, Record<TKey, string>>,
  ) {
    const translationDictionaries = <Record<TLocale, Record<'translation', Record<TKey, string>>>>{};
    for (const locale in localizationDicionaries) {
      translationDictionaries[locale] = { translation: localizationDicionaries[locale] };
    }

    i18next.init({
      supportedLngs: supportedLocales,
      lng: defaultLocale,
      fallbackLng: defaultLocale,
      resources: translationDictionaries,
      parseMissingKeyHandler: () => this.__('global.error.generic'),
    });
  },
};
