import { useEffect } from 'react';

import { getContext, readContextResponse } from './utils';

// Remove this and use "real" PCore type once .d.ts is fixed (currently shows 1 error)
declare const PCore: any;

export default function useInit(props) {
  const {
    referenceList,
    getPConnect,
    personalizationId,
    parameters,
    compositeKeys,
    isSearchable,
    allowBulkActions,
    ref,
    showDynamicFields,
    isDataObject,
    xRayUid,
    cosmosTableRef
  } = props;
  let { editing, selectionMode } = props;

  const runtimeParams = PCore.getRuntimeParamsAPI().getRuntimeParams();

  let selectionCountThreshold;
  useEffect(() => {
    let isCompStillMounted = true; // react hooks cleanup function will toggle this flag and use it before setting a state variable

    (async function init() {
      // promise to fetch metadata
      const metaDataPromise = PCore.getAnalyticsUtils().getDataViewMetadata(referenceList, showDynamicFields);

      const promisesArray = [metaDataPromise];

      // promise to fetch report configured columns
      const reportColumnsPromise = PCore.getAnalyticsUtils()
        .getFieldsForDataSource(referenceList, false, getPConnect().getContextName())
        .catch(() => {
          return Promise.resolve({
            data: { data: [] }
          });
        });
      promisesArray.push(reportColumnsPromise);

      const fetchEditDetails = async (metadata) => {
        const {
          data: { isQueryable }
        } = metadata;
        if (!isDataObject) {
          if (!isQueryable) {
            editing = false; /* Force editing to false if DP is non queryable */
          }

          const { MULTI_ON_HOVER, MULTI } = PCore.getConstants().LIST_SELECTION_MODE;
          if (allowBulkActions && isQueryable) {
            /** enable bulk actions only if DP is queryable */
            selectionMode = MULTI_ON_HOVER;
          }
          if ([MULTI_ON_HOVER, MULTI].includes(selectionMode)) {
            selectionCountThreshold = 250; // Results count should not be greater than threshold to display SelectAll checkbox.
          }
        }
        return Promise.resolve();
      };

      const editPromise = metaDataPromise.then((metadata) => fetchEditDetails(metadata));
      promisesArray.push(editPromise);
      getContext({
        tableSource: referenceList,
        ListId: personalizationId,
        runtimeParams: parameters ?? runtimeParams,
        promisesArray,
        getPConnect,
        compositeKeys,
        isSearchable,
        isCacheable: true,
        xRayUid
      })
        .then(async (context) => {
          if (isCompStillMounted) {
            return readContextResponse(context, {
              ...props,
              editing,
              selectionCountThreshold,
              ref,
              selectionMode,
              xRayUid,
              cosmosTableRef
            });
          }
        });
    })();

    return () => {
      isCompStillMounted = false;
    };
  }, []);
}
