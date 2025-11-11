export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Get a localized value from the Generic Fields
 * @param path - The path within Generic Fields (e.g., 'CosmosFields.fields.lists')
 * @param key - The key of the string to localize
 * @returns The localized string or the key itself if no translation is found
 */
export function getGenericFieldsLocalizedValue(path: string, key: string): string {
  const localeStore = PCore.getLocaleUtils().localeStore;

  if (!localeStore) return key;

  // Split the path and traverse the object
  const pathParts = path.split('.');
  let currentObj: any = localeStore;

  for (const part of pathParts) {
    if (!currentObj[part]) return key;
    currentObj = currentObj[part];
  }

  return currentObj[key] || key;
}
