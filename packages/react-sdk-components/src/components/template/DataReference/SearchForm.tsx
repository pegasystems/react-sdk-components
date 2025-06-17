import { useState } from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs, Typography, RadioGroup, FormControlLabel, Radio, Select, MenuItem, Grid, Box } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';

import useGetTabsCount from '../../../hooks/useGetTabsCount';
import { tabClick, getActiveTabId, getFirstVisibleTabId } from '../../template/SubTabs/tabUtils';
import { getFieldMeta } from './utils';
import { Padding } from '@mui/icons-material';

const publishEvent = ({ clearSelections, viewName }) => {
  const payload: any = {};

  if (clearSelections) {
    payload.clearSelections = clearSelections;
  }

  if (viewName) {
    payload.viewName = viewName;
  }

  PCore.getPubSubUtils().publish('update-advanced-search-selections', payload);
};

const checkIfSelectionsExist = (getPConnect) => {
  const { MULTI } = PCore.getConstants().LIST_SELECTION_MODE;
  const { selectionMode, readonlyContextList, contextPage, contextClass, name } = getPConnect().getConfigProps();
  const isMultiSelectMode = selectionMode === MULTI;

  const dataRelationshipContext = contextClass && name ? name : null;

  const { compositeKeys } = getFieldMeta(getPConnect, dataRelationshipContext);

  let selectionsExist = false;
  if (isMultiSelectMode) {
    selectionsExist = readonlyContextList?.length > 0;
  } else if (contextPage) {
    selectionsExist = compositeKeys?.filter((key) => !['', null, undefined].includes(contextPage[key]))?.length > 0;
  }
  return selectionsExist;
};

const SearchForm = (props) => {
  const { children, getPConnect, searchSelectCacheKey } = props;
  const { getLocaleValue } = PCore.getLocaleUtils();

  const deferLoadedTabs = children[2];
  //@ts-ignore
  const cache: any = PCore.getNavigationUtils().getComponentCache(searchSelectCacheKey) ?? {};
  const { selectedCategory } = cache;
  const firstTabId = getFirstVisibleTabId(deferLoadedTabs, selectedCategory);

  const [currentTabId, setCurrentTabId] = useState(
    getActiveTabId(deferLoadedTabs.props.getPConnect().getChildren(), firstTabId)
  );

  //@ts-ignore
  const { data: tabData } = useGetTabsCount(deferLoadedTabs, 'searchForm', currentTabId);

  const handleTabClick = (event) => {
    const tabId = event.target.value;
    const viewName = tabData
      .find((tab) => tab.id === currentTabId)
      .getPConnect()
      .getConfigProps().name;

    if (checkIfSelectionsExist(getPConnect)) {
      // Handle modal logic here if needed
    } else {
      //@ts-ignore
      publishEvent({ viewName, tabId });
      tabClick(tabId, tabData, currentTabId, setCurrentTabId);
    }
  };

  const tabItems = tabData?.filter((tab) => tab.visibility()) || [];
  const radioGroupLabel = getLocaleValue('Search for', 'DataReference');
  const propsToUse = { ...getPConnect().getInheritedProps() };

  let searchCategoriesComp;
  if (tabItems.length > 3) {
    searchCategoriesComp = (
      <Grid container spacing={2}>
        <Select value={currentTabId} onChange={handleTabClick} fullWidth>
          {tabItems.map((tab) => (
            <MenuItem key={tab.id} value={tab.id}>
              {tab.name}
            </MenuItem>
          ))}
        </Select>
      </Grid>
    );
  } else if (tabItems.length > 1) {
    searchCategoriesComp = (
      <RadioGroup row value={currentTabId} onChange={handleTabClick}>
        {tabItems.map((tab) => (
          <FormControlLabel key={tab.id} value={tab.id} control={<Radio />} label={tab.name} />
        ))}
      </RadioGroup>
    );
  }
  console.log('SearchForm propsToUse:', tabItems);
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="h5">{propsToUse.label}</Typography>
      {searchCategoriesComp}
      <TabContext value={currentTabId}>
        <Tabs style={{display: 'none'}} value={currentTabId} onChange={(e, newValue) => setCurrentTabId(newValue)}>
          {tabItems.map((tab) => (
            <Tab key={tab.id} label={tab.name} value={tab.id} />
          ))}
        </Tabs>
        {tabItems.map((tab) => (
          <TabPanel style={{padding: '0px'}} key={tab.id} value={tab.id}>
            <div className='search-form'>{tab.content}</div>
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  );
};

export default SearchForm;
