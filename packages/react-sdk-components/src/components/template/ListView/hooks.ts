import { useEffect, useRef } from 'react';

import { getContext, readContextResponse } from './utils';

/**
 * Hook that subscribes to parameter field changes and triggers a data re-fetch
 * when the parameters change. This mirrors the useCascadeAndUpdate hook from
 * the constellation-frontend codebase.
 */
export function useCascadeAndUpdate({ getPConnect, listContext, referenceList, parameters, fetchDataFromServer }) {
  const isParametersOverride = !!parameters;
  const fetchRef = useRef(fetchDataFromServer);
  fetchRef.current = fetchDataFromServer;

  useEffect(() => {
    if (Object.keys(listContext).length === 0) return;

    const fieldChangeCallback = () => {
      if (listContext.meta) {
        // Resolve fresh parameters at callback time since the subscription fires
        // before React re-renders with updated props
        const { parameters: freshParams } = getPConnect().getConfigProps();
        fetchRef.current(freshParams);
      }
    };

    const rawViewParameters = getPConnect().getComponentConfig?.()?.parameters;
    const subscriptionId = crypto.randomUUID();

    const overriddenParamFields: string[] = [];

    // Collect overridden parameter fields that are property references
    if (rawViewParameters && isParametersOverride) {
      Object.keys(rawViewParameters).forEach(paramKey => {
        const paramField = rawViewParameters[paramKey];
        if (PCore.getAnnotationUtils().isProperty(paramField)) {
          overriddenParamFields.push(`.${PCore.getAnnotationUtils().getPropertyName(paramField)}`);
        }
      });
    }

    // Subscribe to parameter field changes when parameters are overridden on the view
    if (overriddenParamFields.length !== 0) {
      PCore.getDataPageUtils().subscribeToUpdate(
        referenceList,
        overriddenParamFields,
        getPConnect().getContextName(),
        getPConnect().getPageReference(),
        fieldChangeCallback,
        `${subscriptionId}-override-params`
      );
    }

    return function cleanup() {
      if (overriddenParamFields.length !== 0) {
        PCore.getDataPageUtils().unsubscribe(
          referenceList,
          overriddenParamFields,
          getPConnect().getContextName(),
          getPConnect().getPageReference(),
          `${subscriptionId}-override-params`
        );
      }
    };
  }, [listContext]);
}

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
    cosmosTableRef
  } = props;
  let { editing, selectionMode } = props;

  const runtimeParams = PCore.getRuntimeParamsAPI().getRuntimeParams();

  let selectionCountThreshold;
  useEffect(() => {
    let isCompStillMounted = true; // react hooks cleanup function will toggle this flag and use it before setting a state variable

    (async function init() {
      // promise to fetch metadata
      const metaDataPromise: Promise<any> = PCore.getAnalyticsUtils().getDataViewMetadata(referenceList, showDynamicFields);

      const promisesArray = [metaDataPromise];

      // promise to fetch report configured columns
      const reportColumnsPromise = (
        PCore.getAnalyticsUtils().getFieldsForDataSource(referenceList, false, getPConnect().getContextName()) as Promise<any>
      ).catch(() => {
        return Promise.resolve({
          data: { data: [] }
        });
      });
      promisesArray.push(reportColumnsPromise);

      const fetchEditDetails = async metadata => {
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

      const editPromise = metaDataPromise.then(metadata => fetchEditDetails(metadata));
      promisesArray.push(editPromise);
      getContext({
        tableSource: referenceList,
        ListId: personalizationId,
        runtimeParams: parameters ?? runtimeParams,
        promisesArray,
        getPConnect,
        compositeKeys,
        isSearchable,
        isCacheable: true
      }).then(async context => {
        if (isCompStillMounted) {
          return readContextResponse(context, {
            ...props,
            editing,
            selectionCountThreshold,
            ref,
            selectionMode,
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
