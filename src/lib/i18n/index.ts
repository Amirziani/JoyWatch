/**
 * Tiny i18n layer. All user-facing strings live in a locale file (en.ts).
 * To add Egyptian Arabic: create ar-EG.ts exporting a `Messages`, register it in
 * LOCALES below, and the <html dir> + Tailwind logical properties (ms-/me-/start-)
 * flip the layout. Media timelines stay LTR on purpose.
 */
import { en, type MessageKey } from "./en";

export type { MessageKey };
export type Messages = Record<MessageKey, string>;

export const LOCALES: Record<string, { messages: Messages; dir: "ltr" | "rtl"; label: string }> = {
  en: { messages: en, dir: "ltr", label: "English" },
  // "ar-EG": { messages: arEG, dir: "rtl", label: "العربية (مصر)" },
};

export const DEFAULT_LOCALE = "en";
let current = DEFAULT_LOCALE;

export function setLocale(locale: string) {
  if (LOCALES[locale]) current = locale;
}
export const getLocale = () => current;
export const getDir = () => LOCALES[current].dir;

export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const msg = LOCALES[current].messages[key] ?? en[key] ?? key;
  if (!vars) return msg;
  return msg.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
