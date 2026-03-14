import { useState, useEffect, useMemo, useCallback, useRef, Children, type PropsWithChildren, type SyntheticEvent } from 'react';

import useGetTabsCount from '../../../hooks/useGetTabsCount';
import { searchtabsClick as tabClick, getActiveTabId, getFirstVisibleTabId } from '../SubTabs/tabUtils';
import { getInstructions } from '../../helpers/template-utils';
import type { PConnProps } from '../../../types/PConnProps';

const ComponentName = 'HierarchicalForm';

const getLandingPageViewName = (contextName: string) => {
  const target = contextName.substring(0, contextName.lastIndexOf('_'));
  const activeContainerItemID = PCore.getContainerUtils().getActiveContainerItemName(target);
  const containerItemData = PCore.getContainerUtils().getContainerItemData(target, activeContainerItemID);
  return containerItemData?.view?.config?.name;
};

export interface HierarchicalFormProps extends PConnProps {
  tabsVisibility?: Record<string, boolean>;
  template?: string;
  instructions?: string;
  lastUpdateCaseTime?: string | number;
}

export function useHierarchicalForm(props: PropsWithChildren<HierarchicalFormProps>) {
  const { children = [], getPConnect, tabsVisibility = {}, template } = props;
  const [tabErrors, setTabErrors] = useState<Record<string, any>>({});
  const tabErrorsRef = useRef<Record<string, any>>({});
  const submitAttemptedRef = useRef(false);
  const { lastUpdateCaseTime = getPConnect().getValue('caseInfo.lastUpdateTime') } = props;
  const fullCaseId = getPConnect().getValue(PCore.getConstants().CASE_INFO.CASE_INFO_ID);

  const deferLoadedTabs: any = Children.toArray(children)[0];
  deferLoadedTabs.props.getPConnect().setInheritedProp('template', template);

  const navigationKey = useMemo(() => {
    const parentNavKey = `${
      getPConnect().getValue(PCore.getConstants().CASE_INFO.CASE_INFO_ID) || getLandingPageViewName(getPConnect().getContextName())
    }`;
    return `${parentNavKey}-${getPConnect().getMetadata()?.name}-${ComponentName}`;
  }, []);

  const instructions = getInstructions(getPConnect(), props.instructions);

  const storedTab = (PCore.getNavigationUtils().getComponentState(navigationKey) as any)?.activeTab;

  const tabsFromChildren = deferLoadedTabs.props.getPConnect().getChildren();

  const firstTabId = getFirstVisibleTabId(deferLoadedTabs, undefined);

  const [currentTabId, setCurrentTabId] = useState(getActiveTabId(tabsFromChildren, storedTab || firstTabId));
  const [tabVisibilityStr, setTabVisibilityStr] = useState('');
  const { data: tabData, refreshTabData } = useGetTabsCount(deferLoadedTabs, 'hierarchical', currentTabId, template);

  const handleCaseRefresh = (message: any) => {
    if (message.subtype === 'tab') {
      refreshTabData();
    }
  };

  useEffect(() => {
    let index = 0;
    let caseSubId = '';
    deferLoadedTabs.props
      .getPConnect()
      .getChildren()
      ?.forEach((child: any) => {
        const rawConfigProps = child.getPConnect().getRawConfigProps();
        if ('visibility' in rawConfigProps) {
          tabsVisibility[`${index}`] = rawConfigProps.visibility;
        }
        index += 1;
      });

    getPConnect().registerAdditionalProps({ tabsVisibility });
    getPConnect().registerAdditionalProps({ lastUpdateCaseTime: '@P caseInfo.lastUpdateTime' });

    if (fullCaseId) {
      caseSubId = PCore.getMessagingServiceManager().getCaseSubscription(fullCaseId).subscribe({ caseId: fullCaseId }, handleCaseRefresh);
    }

    return () => {
      if (fullCaseId) PCore.getMessagingServiceManager().getCaseSubscription(fullCaseId).unsubscribe(caseSubId);
    };
  }, []);

  useEffect(() => {
    refreshTabData();
  }, [lastUpdateCaseTime]);

  useEffect(() => {
    const isVisibilityAvailable =
      Object.values(tabsVisibility).length > 0 && Object.values(tabsVisibility).every(visibility => typeof visibility === 'boolean');
    if (isVisibilityAvailable) {
      let str = '';
      Object.keys(tabsVisibility).forEach(key => {
        str += key + tabsVisibility[key];
      });
      setTabVisibilityStr(str);
    }
  }, [tabsVisibility]);

  useEffect(() => {
    if (tabData && tabData.length) {
      const activeTabId = getActiveTabId(tabData, currentTabId);
      if (activeTabId !== currentTabId) {
        setCurrentTabId(activeTabId);
      }
    }
  }, [tabVisibilityStr, tabData]);

  useEffect(() => {
    PCore.getNavigationUtils().setComponentState(navigationKey, { activeTab: currentTabId });
    const activeTabNavKey = `${getPConnect().getValue(PCore.getConstants().CASE_INFO.CASE_INFO_ID)}-CaseView-ActiveTab`;
    PCore.getNavigationUtils().setComponentState(activeTabNavKey, { id: currentTabId });

    return () => {
      if (getPConnect().getContextName()?.includes('/modal')) {
        PCore.getNavigationUtils().setComponentState(navigationKey, { activeTab: firstTabId });
      }
    };
  }, [currentTabId, children]);

  const handleTabClick = useCallback(
    (event: SyntheticEvent, id: string) => {
      tabClick(id, tabData, currentTabId, setCurrentTabId);
    },
    [tabData, currentTabId]
  );

  const tabItems = useMemo(() => tabData?.filter((tab: any) => tab.visibility()) ?? [], [tabData, tabVisibilityStr]);

  const tabsRef = useRef(tabItems);
  tabsRef.current = tabItems;

  const updateTabErrorsOnViewMutate = useCallback((messageObject: any, tab: any) => {
    if (!messageObject.type) {
      return;
    }
    const previousTabErrors = tabErrorsRef.current;
    let currentTabState = previousTabErrors[tab.id] || {};
    const { MESSAGES_TYPE_ERROR } = PCore.getConstants().MESSAGES;
    if (messageObject.type !== MESSAGES_TYPE_ERROR) {
      delete currentTabState[messageObject.fieldName];
      currentTabState = Object.keys(currentTabState).length > 0 ? currentTabState : undefined;
    } else {
      currentTabState = { ...currentTabState, [messageObject.fieldName]: messageObject.messages };
    }
    const newErrors = { ...previousTabErrors, [tab.id]: currentTabState };
    tabErrorsRef.current = newErrors;
    setTabErrors(newErrors);
  }, []);

  useEffect(() => {
    const rawConfig = '_rawConfig';
    tabItems.forEach((tab: any) => {
      PCore.getContextTreeManager().onViewMutate(
        tab.getPConnect().getContextName(),
        tab.getPConnect().getPageReference(),
        tab.getPConnect()[rawConfig].config?.name,
        (messageObject: any) => updateTabErrorsOnViewMutate(messageObject, tab)
      );
    });
  }, [tabItems, updateTabErrorsOnViewMutate]);

  const navigateToFirstErrorTab = useCallback(() => {
    const currentErrors = tabErrorsRef.current;
    const firstTabWithError = tabsRef.current.find((tab: any) => {
      const tabErrorState = currentErrors[tab.id];
      return tabErrorState && Object.keys(tabErrorState).length > 0;
    });
    if (firstTabWithError) {
      submitAttemptedRef.current = false;
      setCurrentTabId(firstTabWithError.id);
    }
  }, []);

  const highlightFirstErrorTab = useCallback(() => {
    submitAttemptedRef.current = true;
    navigateToFirstErrorTab();
  }, [navigateToFirstErrorTab]);

  useEffect(() => {
    const { CURRENT_ASSIGNMENT_UPDATED } = PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS;
    PCore.getPubSubUtils().subscribe(
      CURRENT_ASSIGNMENT_UPDATED,
      () => {
        tabErrorsRef.current = {};
        submitAttemptedRef.current = false;
        setTabErrors({});
      },
      'CURRENT_ASSIGNMENT_UPDATED-HierarchicalForm'
    );

    PCore.getPubSubUtils().subscribe(
      PCore.getConstants().PUB_SUB_EVENTS.ERROR_ON_FINISH_ASSIGNMENT,
      highlightFirstErrorTab,
      'ERROR_ON_FINISH_ASSIGNMENT-HierarchicalForm'
    );

    return () => {
      PCore.getPubSubUtils().unsubscribe(CURRENT_ASSIGNMENT_UPDATED, 'CURRENT_ASSIGNMENT_UPDATED-HierarchicalForm');
      PCore.getPubSubUtils().unsubscribe(
        PCore.getConstants().PUB_SUB_EVENTS.ERROR_ON_FINISH_ASSIGNMENT,
        'ERROR_ON_FINISH_ASSIGNMENT-HierarchicalForm'
      );
    };
  }, []);

  useEffect(() => {
    if (submitAttemptedRef.current) {
      navigateToFirstErrorTab();
    }
  }, [tabErrors, navigateToFirstErrorTab]);

  const processedTabs = useMemo(() => {
    return tabItems.map(tab => {
      const errorKeys = Object.keys(tabErrors[tab.id] ?? {});
      const errors = errorKeys.length > 0 ? errorKeys.reduce((sum, fieldName) => sum + tabErrors[tab.id][fieldName].length, 0) : undefined;
      return { ...tab, errors };
    });
  }, [tabItems, tabErrors]);

  return { currentTabId, handleTabClick, processedTabs, instructions };
}
