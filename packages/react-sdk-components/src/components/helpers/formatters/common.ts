declare const PCore:any;

export function getLocale(locale = "en-US") {
  // use locale if specified
  if (locale) return locale;
  // otherwise, use operator locale if it's defined
  if (PCore.getEnvironmentInfo().getUseLocale()) return PCore.getEnvironmentInfo().getUseLocale();
  // fallback
  return Intl.DateTimeFormat().resolvedOptions().locale;
}

export function getCurrentTimezone(timezone="America/New_York") {
  if (timezone) return timezone;
  return PCore?.getLocaleUtils?.().getTimeZoneInUse?.();
}
