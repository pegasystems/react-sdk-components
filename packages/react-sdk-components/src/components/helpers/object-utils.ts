/**
 * Returns the value of the key from objectInfo/caseInfo
 * Added fallback to retrieve from caseInfo if objectInfo not present.
 * @param pConnect
 * @param key
 * @returns the value of key
 */
export const getResolvedConstantValue = (pConnect: typeof PConnect, key: string) => {
  return pConnect.getValue(PCore.getResolvedConstantValue(key)) || pConnect.getValue(key);
};
