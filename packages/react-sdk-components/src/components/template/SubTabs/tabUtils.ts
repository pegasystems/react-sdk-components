export const getDeferFriendlyTabs = allTabs => {
  return allTabs.map(tab => {
    const theTabCompConfig = tab.getPConnect().getConfigProps();
    return { type: 'DeferLoad', config: theTabCompConfig };
  });
};

export const getVisibleTabs = (allTabs, uuid) => {
  let index = 0;
  return allTabs.props
    .getPConnect()
    .getChildren()
    ?.filter(child => {
      // US-402838: Filter out tab entries if the config object does not contain the visibility attribute or it evaluates to the boolean true,
      const config = child.getPConnect().getConfigProps();

      // BUG-642335 - adding isChildDeferLoad prop
      if (child.getPConnect().getComponentName() === 'DeferLoad') {
        const { name: viewName, deferLoadId = `${viewName}_${uuid}_${index}` } = config;
        child.getPConnect().registerAdditionalProps({
          deferLoadId,
          isChildDeferLoad: true,
          lastUpdateCaseTime: '@P caseInfo.lastUpdateTime'
        });
      }
      index += 1;
      return !('visibility' in config) || config.visibility === true;
    });
};

export const getTransientTabs = (availableTabs, currentTabId, tabItems) => {
  return (
    availableTabs?.map((child, i) => {
      const config = child.getPConnect().getConfigProps();
      const tabLabel =
        config.label ||
        config.inheritedProps?.find(obj => obj.prop === 'label')?.value ||
        PCore.getLocaleUtils().getLocaleValue('No label specified in config', 'Generic');
      const tabContent = () => {
        if (i.toString() === currentTabId) {
          return tabItems?.[i.toString()]?.content ? tabItems?.[i.toString()]?.content : child.getPConnect().getComponent();
        }
        return tabItems?.[i.toString()]?.content;
      };
      return {
        name: tabLabel,
        id: i.toString(),
        content: tabContent()
      };
    }) || []
  );
};

export const tabClick = (id, availableTabs, currentTabId, setCurrentTabId, tabItems) => {
  const currentPConn = availableTabs[currentTabId].getPConnect();
  const { deferLoadId } = currentPConn.getConfigProps();
  PCore.getDeferLoadManager().deactivate(deferLoadId, currentPConn.getContextName());

  setCurrentTabId(id);
  const index = parseInt(id, 10);
  if (tabItems[index]?.content === null) {
    tabItems[index].content = availableTabs[index].getPConnect().getComponent();
  }

  const nextPConn = availableTabs[id].getPConnect();
  const { deferLoadId: activeId } = nextPConn?.getConfigProps() || {};
  PCore.getDeferLoadManager().activate(activeId, nextPConn?.getContextName());
  PCore.getDeferLoadManager().refreshComponent(activeId, nextPConn?.getContextName());
};

export const searchtabsClick = (id, mainTabs, currentTabId, setCurrentTabId) => {
  const currentTab = mainTabs.find(item => item.id === currentTabId && item.visibility());
  const currentPConn = currentTab?.getPConnect();
  const { deferLoadId } = currentPConn?.getConfigProps() ?? {};
  PCore.getDeferLoadManager().deactivate(deferLoadId, currentPConn.getContextName());

  setCurrentTabId(id);
  const nextActiveTab = mainTabs.find(item => item.id === id && item.visibility());
  if (mainTabs && nextActiveTab?.content === null) {
    nextActiveTab.content = nextActiveTab.getPConnect().getComponent();
  }

  const nextPConn = nextActiveTab.getPConnect();
  const { deferLoadId: activeId } = nextPConn.getConfigProps();
  PCore.getDeferLoadManager().activate(activeId, nextPConn.getContextName());
  PCore.getDeferLoadManager().refreshComponent(activeId, nextPConn.getContextName());
};

export const getTabLabel = tabPConnect => {
  const config = tabPConnect.getConfigProps();

  const label = config.inheritedProps?.find(obj => obj.prop === 'label')?.value;

  if (label) {
    return label;
  }
  if (config.label) {
    return config.label;
  }

  if (tabPConnect.getReferencedView()?.config?.label) {
    return tabPConnect.getReferencedView()?.config?.label;
  }

  return PCore.getLocaleUtils().getLocaleValue('No label specified in config', 'Generic');
};

export const getActiveTabId = (mainTabs, currentTabId) => {
  let firstVisibleTabId = null;
  let updatedActiveId = currentTabId;
  let isCurrentTabFound = false;

  if (!mainTabs?.length) {
    return updatedActiveId;
  }

  for (let i = 0; i < mainTabs.length; i += 1) {
    const tab = mainTabs[i];
    const tabConfig = tab.getPConnect().getConfigProps();
    const tabId = tab?.id || `${tab.getPConnect().viewName}-${tabConfig.name || getTabLabel(tab.getPConnect())}-${i}`;
    const isTabVisible = !Object.hasOwn(tabConfig, 'visibility') || tabConfig.visibility === true;
    if (isTabVisible && !firstVisibleTabId) {
      firstVisibleTabId = tabId;
      if (isCurrentTabFound) {
        updatedActiveId = firstVisibleTabId;
        break;
      }
    }
    if (tabId === currentTabId) {
      isCurrentTabFound = true;
      if (isTabVisible) {
        break;
      } else if (firstVisibleTabId) {
        updatedActiveId = firstVisibleTabId;
        break;
      }
    }
  }
  return updatedActiveId;
};
/**
 *
 * @param {*} deferLoadedTabs list of deferLoadedTabs
 * @param {string} tabViewName (optional) if provided, tabId of the given tabView will be returned
 * @returns {string} a tab id is returned
 */
export const getFirstVisibleTabId = (deferLoadedTabs, tabViewName) => {
  let tabIndex = 0;

  const viewName = deferLoadedTabs?.props?.getPConnect()?.options?.viewName;

  const deferTabsChildren = deferLoadedTabs.props.getPConnect().getChildren();
  if (tabViewName) {
    const firstVisibleTab = deferTabsChildren?.find((item, index) => {
      const tabConfig = item.getPConnect().getConfigProps();
      if (tabViewName === tabConfig.name) {
        tabIndex = index;
        return true;
      }
      return false;
    });
    const tabConfig = firstVisibleTab.getPConnect().getConfigProps();

    return `${viewName}-${tabConfig.name || getTabLabel(firstVisibleTab.getPConnect())}-${tabIndex}`;
  }

  const firstVisibleTab = deferLoadedTabs.props
    .getPConnect()
    .getChildren()
    ?.find((item, index) => {
      const tabConfig = item.getPConnect().getConfigProps();
      if (!('visibility' in tabConfig) || tabConfig.visibility === true) {
        tabIndex = index;
        return true;
      }
      return false;
    });

  if (!firstVisibleTab) {
    return null;
  }

  const tabConfig = firstVisibleTab.getPConnect().getConfigProps();
  return `${viewName}-${tabConfig.name || getTabLabel(firstVisibleTab.getPConnect())}-${tabIndex}`;
};
