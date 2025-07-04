export function isEmptyObject(obj: Object): boolean {
  return Object.keys(obj).length === 0;
}

export function getLocalizedNoRecordsMessage(): string {
  const GENERIC_BUNDLE_KEY = PCore.getLocaleUtils().GENERIC_BUNDLE_KEY;
  return PCore.getLocaleUtils().localeStore[GENERIC_BUNDLE_KEY]?.CosmosFields?.fields?.lists?.['No records found.'] || 'No records found.';
}
