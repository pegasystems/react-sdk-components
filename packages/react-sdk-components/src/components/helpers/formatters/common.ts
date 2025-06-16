export function getLocale(locale: string = '') {
  // use locale if specified
  if (locale) return locale;
  // otherwise, use operator locale if it's defined
  if (PCore.getEnvironmentInfo().getLocale()) return PCore.getEnvironmentInfo().getLocale();
  // fallback
  return Intl.DateTimeFormat().resolvedOptions().locale;
}

export function getCurrentTimezone(timezone?: string) {
  // use timezone if specified
  if (timezone) return timezone;
  return PCore?.getLocaleUtils?.().getTimeZoneInUse?.();
}
