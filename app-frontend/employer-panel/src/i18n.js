import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translations from "./i18n/translations";

const savedLanguage = localStorage.getItem("language") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      hi: { translation: translations.hi },
      pa: { translation: translations.pa },
      zh: { translation: translations.zh },
    },
    lng: savedLanguage,
    fallbackLng: "en",
    defaultNS: "translation",
    ns: ["translation"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;