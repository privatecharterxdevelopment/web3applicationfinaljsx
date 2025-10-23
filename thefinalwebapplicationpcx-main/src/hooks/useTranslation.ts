import { useTranslation as useI18nTranslation } from 'react-i18next';
import { translateText } from '../utils/translate';

export function useTranslation() {
  const { t: i18nT, i18n } = useI18nTranslation();

  const t = async (key: string, options?: any) => {
    // First try to get translation from i18n
    let translation = i18nT(key, options);

    // If translation is the same as the key, it means no translation was found
    if (translation === key && i18n.language !== 'en') {
      // Fallback to Google Translate
      translation = await translateText(key, i18n.language);
    }

    return translation;
  };

  return { t, i18n };
}