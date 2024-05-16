export function isEmptyObject(obj: Object): boolean {
  return Object.keys(obj).length === 0;
}

export function isInfinity23OrHigher() {
  const pCoreVersion = PCore.getPCoreVersion();
  return ['8.23.0', '23.1.1', '23.1.2'].includes(pCoreVersion);
}
