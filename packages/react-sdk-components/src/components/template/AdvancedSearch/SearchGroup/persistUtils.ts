import { Utils } from '../../../helpers/utils';

const SKIP_CACHE_KEY = '';

const getComponentStateKey = (getPConnect, propertyName: string) => {
  const pConnect = getPConnect();
  const caseID = `.${Utils.getMappedKey('pyID')}`; // Enhance this later when use-case arrives for data objects using S&S.
  const resolvedCaseID = pConnect.getValue(caseID);

  if (!resolvedCaseID) {
    return SKIP_CACHE_KEY;
  }

  return `Search-${resolvedCaseID}-${pConnect.getPageReference()}-${propertyName}-${pConnect.getCurrentView()}`;
};

const getComponentStateOptions = (getPConnect) => {
  return { clearOnCancelForContext: getPConnect().getContextName() };
};

interface SearchCategory {
  // tabId of search category selected
  selectedCategory: string;
}

interface SearchGroup {
  // searchFields can be any object based on what fields are authored.
  searchFields: unknown;
  activeGroupId: string;
}

const setComponentCache = ({
  cacheKey,
  state,
  options,
}: {
  cacheKey: string;
  state: SearchCategory | SearchGroup;
  options: ReturnType<typeof getComponentStateOptions>;
}) => {
  if (cacheKey !== SKIP_CACHE_KEY) {
    (PCore.getNavigationUtils() as any).setComponentCache(cacheKey, state, options);
  }
};

const componentCachePersistUtils = {
  getComponentStateKey,
  getComponentStateOptions,
  setComponentCache,
};

export default componentCachePersistUtils;
