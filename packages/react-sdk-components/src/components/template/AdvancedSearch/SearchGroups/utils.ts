function isEmpty(value: any): boolean {
  return (
    // null or undefined
    value === null ||
    value === undefined ||
    ((Array.isArray(value) || typeof value === 'string') && value.length === 0) ||
    // is an Object and has no keys
    (value.constructor === Object && Object.keys(value).length === 0)
  );
}

export function getCacheInfo(
  cache: { selectedCategory: string; activeGroupId: string; searchFields: unknown },
  groups: { config: { id: string } }[]
) {
  let initialActiveGroupId = groups.length ? groups[0].config.id : '';

  let useCache = false;
  if (cache.activeGroupId && groups?.find(group => group.config.id === cache.activeGroupId)) {
    initialActiveGroupId = cache.activeGroupId;
    useCache = true;
  }

  return { useCache, initialActiveGroupId };
}

export function isValidInput(input: { [s: string]: unknown }) {
  return Object.values(input).some(value => !isEmpty(value));
}
