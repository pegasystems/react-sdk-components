import { useEffect, useState } from "react";
import { Tab, Tabs } from "@material-ui/core";
import { TabContext, TabPanel } from '@material-ui/lab';

import { getTransientTabs, getVisibleTabs, tabClick } from './tabUtils';

// SubTabs does NOT have getPConnect. So, no need to extend from PConnProps

interface SubTabsProps {
  // If any, enter additional props that only exist on this component
  children: any[]
}


export default function SubTabs(props: SubTabsProps) {
  const { children = [] } = props;

  const defaultTabIndex = 0;
  const deferLoadedTabs = children[0];
  const availableTabs = getVisibleTabs(deferLoadedTabs, "tabsSubs");
  const [currentTabId, setCurrentTabId] = useState(defaultTabIndex.toString());

  const [tabItems, setTabitem] = useState<any[]>([]);
  useEffect(() => {
    const tempTabItems = getTransientTabs(
      availableTabs,
      currentTabId,
      tabItems
    );
    setTabitem(tempTabItems);
  }, [currentTabId]);


  const handleTabClick = (id, index: string) => {
    setCurrentTabId(index);
    tabClick(index, availableTabs, currentTabId, setCurrentTabId, tabItems);
  };

  return (
    <TabContext value={currentTabId.toString()}>
      <Tabs
        onChange={handleTabClick}
        value={currentTabId}
        variant="scrollable"
        >
      {tabItems.map((tab:any) =>
        <Tab
        key={tab.id}
        label={tab.name}
        value={tab.id}
        />
  )}
    </Tabs>

      {
        tabItems.map((tab:any) => (
          <TabPanel key={tab.id} value={tab.id} tabIndex={+tab.id}>
            <div>{tab.content ? tab.content : "No content exists"}</div>
          </TabPanel>
        ))}
      </TabContext>
  );
}
