import { useState, useEffect, useCallback, useMemo } from 'react';

import { getTabLabel } from '../components/template/SubTabs/tabUtils';

const useGetTabsCount = (deferLoadedTabs, uuid, selectedTabId, template) => {
  const pConn = deferLoadedTabs.props.getPConnect();
  const [availableTabs] = useState(deferLoadedTabs.props.getPConnect().getChildren() || []);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [countMetadata, setCountMetadata] = useState<any[]>([]);
  const [currentTabId, setCurrentTabId] = useState(selectedTabId);

  const viewName = deferLoadedTabs?.props?.getPConnect()?.options?.viewName || null;

  const tabContent = (id, index, overideTabContent, tab) => {
    if (id === currentTabId || template === 'HierarchicalForm') {
      if (overideTabContent) {
        return tab.getPConnect().getComponent();
      }
      if (data[index]?.content) {
        return data[index]?.content;
      }
      return tab.getPConnect().getComponent();
    }
    if (template !== 'HierarchicalForm') {
      return overideTabContent ? null : data[index]?.content;
    }
  };

  const getTabsData = useCallback(
    (overideTabContent) =>
      availableTabs.map((tab, index) => {
        const config = tab.getPConnect().getConfigProps();
        const name = getTabLabel(tab.getPConnect());
        const tabId = `${viewName}-${config.name || name}-${index}`;
        const count = countMetadata.find((item: any) => item.tabId === tabId)?.count;

        return {
          name,
          id: tabId,
          getPConnect: tab.getPConnect,
          content: tabContent(tabId, index, overideTabContent, tab),
          loaded: tabId === currentTabId || Boolean(data[index]?.content),
          visibility: () => {
            const tabConfig = tab.getPConnect().getConfigProps();
            const isVisible = !('visibility' in tabConfig) || tabConfig.visibility === true;
            if (!isVisible) {
              tab.getPConnect().removeNode();
            }
            return isVisible;
          },
          count,
        };
      }),
    [availableTabs, countMetadata, data, currentTabId, uuid],
  );

  const tabCountSources = useMemo(
    () =>
      availableTabs.reduce(
        (prev, tab, index) => {
          const config = tab.getPConnect().getConfigProps();
          const { value: showTabCount } = config.inheritedProps?.find((item) => item.prop === 'showTabCount') || {};
          const { value } = config.inheritedProps?.find((item) => item.prop === 'count') || {};
          const tabCountSource = config.inheritedProps?.find((item) => item.prop === 'tabCount');
          const name = getTabLabel(tab.getPConnect());
          const tabId = `${viewName}-${config.name || name}-${index}`;
          if (showTabCount) {
            if (tabCountSource?.value?.fields?.count) {
              const isPrefixedByDot = tabCountSource.value.fields.count.substring(0, 1) === '.';
              return {
                ...prev,
                dataPageSources: [
                  ...prev.dataPageSources,
                  {
                    dataPageName: tabCountSource.value.source,
                    tabId,
                    tabCountProp: isPrefixedByDot ? tabCountSource.value.fields.count.substring(1) : tabCountSource.value.fields.count,
                    dataViewParameters: tabCountSource.value?.parameters || {},
                  },
                ],
              };
            }
            if (Number.isInteger(value) && value % 1 === 0) {
              return {
                ...prev,
                calculatedFields: [
                  ...prev.calculatedFields,
                  {
                    count: value,
                    context: tab.getPConnect().getContextName(),
                    tabId,
                  },
                ],
              };
            }
            if (value?.isDeferred) {
              return {
                ...prev,
                calculatedFields: [
                  ...prev.calculatedFields,
                  {
                    propertyName: value.propertyName,
                    context: 'content',
                    tabId,
                  },
                ],
              };
            }
          }
          return prev;
        },
        {
          dataPageSources: [],
          calculatedFields: [],
        },
      ),
    [],
  );

  useEffect(() => {
    setCurrentTabId(selectedTabId);
  }, [selectedTabId]);

  useEffect(() => {
    // @ts-expect-error
    setData(getTabsData());
  }, [countMetadata, currentTabId]);

  useEffect(() => {
    const { dataPageSources, calculatedFields } = tabCountSources;
    const calculatedFieldsWithoutValue = calculatedFields.filter((item) => item.propertyName);
    if (dataPageSources.length) {
      setLoading(true);
      Promise.all(dataPageSources.map((item) => PCore.getDataPageUtils().getPageDataAsync(item.dataPageName, '', item.dataViewParameters)))
        .then((res) => {
          const temp = res.map((r, index) => ({
            ...dataPageSources[index],
            count: r[dataPageSources[index].tabCountProp],
          }));
          setCountMetadata(temp);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    } else if (calculatedFieldsWithoutValue.length) {
      PCore.getViewRuleApi()
        // @ts-expect-error
        .getCalculatedFields(
          pConn.getCaseInfo().getKey(),
          pConn.getCurrentView(),
          calculatedFieldsWithoutValue.map(({ propertyName, context }) => ({
            name: propertyName,
            context,
          })),
        )
        .then((res) => {
          const values = res?.data?.caseInfo?.content || {};
          const temp = calculatedFields.map((field) => ({
            ...field,
            count: values[field.propertyName?.substring(1)] || field.count,
          }));
          setCountMetadata(temp);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    } else {
      setCountMetadata(
        calculatedFields.map((field) => ({
          ...field,
          count: field.count,
        })),
      );
    }
  }, []);

  return {
    availableTabs,
    data,
    loading,
    error,
    updateCurrentTabId: setCurrentTabId,
    refreshTabData: () => setData(getTabsData(true)),
  };
};

export default useGetTabsCount;
