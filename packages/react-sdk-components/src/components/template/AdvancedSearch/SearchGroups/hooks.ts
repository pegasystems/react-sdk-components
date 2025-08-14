import { useEffect } from 'react';

const listViewConstants = {
  EVENTS: {
    LIST_VIEW_READY: 'LIST_VIEW_READY'
  }
};
/**
 * This hook registers a callback for the whenever list view component is ready
 * then makes a call to get the data using the search fields pre-filled with cache data.
 */
// eslint-disable-next-line import/prefer-default-export
export function useCacheWhenListViewReady(
  cache: { searchFields: unknown },
  viewName: string,
  useCache: boolean,
  getFilterData: (params: { isCalledFromCache: boolean }) => void,
  searchSelectCacheKey: string
) {
  useEffect(() => {
    if (Object.keys(cache.searchFields ?? {}).length > 0) {
      PCore.getPubSubUtils().subscribe(
        listViewConstants.EVENTS.LIST_VIEW_READY,
        ({ viewName: viewNameFromListView }: { viewName: string }) => {
          if (viewNameFromListView === viewName && useCache) {
            getFilterData({ isCalledFromCache: true });
          }
        },
        `${searchSelectCacheKey}-listview-ready`
      );
    }

    return () => {
      PCore.getPubSubUtils().unsubscribe(listViewConstants.EVENTS.LIST_VIEW_READY, `${searchSelectCacheKey}-listview-ready`);
    };
  }, []);
}
