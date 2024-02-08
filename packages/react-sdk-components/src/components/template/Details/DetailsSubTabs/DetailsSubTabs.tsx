import { Children, PropsWithChildren, useEffect, useState } from 'react';
import { Tab, Tabs, TextField } from '@material-ui/core';
import { TabContext, TabPanel } from '@material-ui/lab';

import { getTransientTabs, getVisibleTabs, tabClick } from '../../SubTabs/tabUtils';
import { PConnProps } from '../../../../types/PConnProps';

interface DetailsSubTabsProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  showLabel: boolean;
  label: string;
}

export default function DetailsSubTabs(props: PropsWithChildren<DetailsSubTabsProps>) {
  const { children = [], label, showLabel = true, getPConnect } = props;
  // Get the inherited props from the parent to determine label settings
  const propsToUse = { label, showLabel, ...getPConnect().getInheritedProps() };

  const defaultTabIndex = 0;
  const deferLoadedTabs = Children.toArray(children)[0];
  let availableTabs = [];

  useEffect(() => {
    availableTabs = getVisibleTabs(deferLoadedTabs, 'detailsSubTabs');
  }, [availableTabs]);

  const [currentTabId, setCurrentTabId] = useState(defaultTabIndex.toString());

  const [tabItems, setTabitem] = useState([]);
  useEffect(() => {
    const tempTabItems = getTransientTabs(availableTabs, currentTabId, tabItems);
    setTabitem(tempTabItems);
  }, [currentTabId]);

  const handleTabClick = (id, index: string) => {
    setCurrentTabId(index);
    tabClick(index, availableTabs, currentTabId, setCurrentTabId, tabItems);
  };

  return (
    <>
      {propsToUse.showLabel && <TextField>{propsToUse.label}</TextField>}
      <TabContext value={currentTabId.toString()}>
        <Tabs onChange={handleTabClick} value={currentTabId}>
          {tabItems.map((tab: any) => (
            <Tab key={tab.id} label={tab.name} value={tab.id} />
          ))}
        </Tabs>

        {tabItems.map((tab: any) => (
          <TabPanel key={tab.id} value={tab.id} tabIndex={+tab.id}>
            <div>{tab.content ? tab.content : 'No content exists'}</div>
          </TabPanel>
        ))}
      </TabContext>
    </>
  );
}
