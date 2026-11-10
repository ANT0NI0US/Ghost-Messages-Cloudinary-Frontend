import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setApiLanguage } from "../api/client.js";
import { LanguageEnum } from "../lib/enums.js";
import { read, write } from "../lib/storage.js";
import ar from "./ar.js";
import en from "./en.js";

const dictionaries = { ar, en };
const I18nContext = createContext(null);

const initialLang = () => {
  const saved = read("gm.lang");
  if (saved === "ar" || saved === "en") return saved;
  return navigator.language?.startsWith("ar") ? "ar" : "en";
};

const lookup = (dict, key) => key.split(".").reduce((node, part) => node?.[part], dict);

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    setApiLanguage(lang === "ar" ? LanguageEnum.AR : LanguageEnum.EN);
    write("gm.lang", lang);
  }, [lang]);

  // t("inbox.page", { page: 1, total: 3 }) → "Page 1 of 3"
  const t = useCallback(
    (key, vars = {}) => {
      const value = lookup(dictionaries[lang], key) ?? lookup(en, key) ?? key;
      if (typeof value !== "string") return value;
      return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
    },
    [lang],
  );

  const formatDate = useCallback(
    (value) =>
      new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value)),
    [lang],
  );

  const toggleLang = useCallback(() => setLang((current) => (current === "ar" ? "en" : "ar")), []);

  const value = useMemo(() => ({ lang, t, formatDate, toggleLang }), [lang, t, formatDate, toggleLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
