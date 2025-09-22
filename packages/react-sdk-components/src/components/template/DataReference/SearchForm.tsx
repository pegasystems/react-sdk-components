import { useState } from 'react';
import { Tab, Tabs, Typography, RadioGroup, FormControlLabel, Radio, MenuItem, Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { TabContext, TabPanel } from '@mui/lab';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

import useGetTabsCount from '../../../hooks/useGetTabsCount';
import { searchtabsClick, getActiveTabId, getFirstVisibleTabId } from '../../template/SubTabs/tabUtils';
import { getFieldMeta } from './utils';

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

const checkIfSelectionsExist = getPConnect => {
  const { MULTI } = PCore.getConstants().LIST_SELECTION_MODE;
  const { selectionMode, readonlyContextList, contextPage, contextClass, name } = getPConnect().getConfigProps();
  const isMultiSelectMode = selectionMode === MULTI;

  const dataRelationshipContext = contextClass && name ? name : null;

  const { compositeKeys } = getFieldMeta(getPConnect, dataRelationshipContext);

  let selectionsExist = false;
  if (isMultiSelectMode) {
    selectionsExist = readonlyContextList?.length > 0;
  } else if (contextPage) {
    selectionsExist = compositeKeys?.filter(key => !['', null, undefined].includes(contextPage[key]))?.length > 0;
  }
  return selectionsExist;
};

const SearchForm = props => {
  const { children, getPConnect, searchSelectCacheKey } = props;

  const deferLoadedTabs = children[2];
  const cache: any = PCore.getNavigationUtils().getComponentCache(searchSelectCacheKey) ?? {};
  const { selectedCategory } = cache;
  const firstTabId = getFirstVisibleTabId(deferLoadedTabs, selectedCategory);
  const [open, setOpen] = useState(false);
  const [currentTabId, setCurrentTabId] = useState(getActiveTabId(deferLoadedTabs.props.getPConnect().getChildren(), firstTabId));
  const [nextTabId, setNextTabId] = useState(null); // State to store the next tab ID
  const { getLocaleValue } = PCore.getLocaleUtils();

  // @ts-ignore
  const { data: tabData } = useGetTabsCount(deferLoadedTabs, 'searchForm', currentTabId);

  const handleTabClick = event => {
    const tabId: any = event.target.value;
    const viewName = tabData
      .find(tab => tab.id === currentTabId)
      .getPConnect()
      .getConfigProps().name;

    if (checkIfSelectionsExist(getPConnect)) {
      setNextTabId(tabId); // Store the next tab ID
      setOpen(true); // Open the dialog
    } else {
      // @ts-ignore
      publishEvent({ viewName, tabId });
      searchtabsClick(tabId, tabData, currentTabId, setCurrentTabId);
    }
  };

  const clearSelectionAndSwitchTab = () => {
    const viewName = tabData
      .find(tab => tab.id === currentTabId)
      .getPConnect()
      .getConfigProps().name;
    publishEvent({ clearSelections: true, viewName });
    searchtabsClick(nextTabId, tabData, currentTabId, setCurrentTabId);
    setOpen(false);
  };

  const onDialogClose = () => {
    setOpen(false); // Close the dialog
  };

  const tabItems = tabData?.filter(tab => tab.visibility()) || [];
  const propsToUse = { ...getPConnect().getInheritedProps() };

  let searchCategoriesComp;
  if (tabItems.length > 3) {
    searchCategoriesComp = (
      <Grid container spacing={2}>
        <TextField value={currentTabId} select onChange={handleTabClick} fullWidth>
          {tabItems.map(tab => (
            <MenuItem key={tab.id} value={tab.id}>
              {tab.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    );
  } else if (tabItems.length > 1) {
    searchCategoriesComp = (
      <RadioGroup row value={currentTabId} onChange={handleTabClick}>
        {tabItems.map(tab => (
          <FormControlLabel key={tab.id} value={tab.id} control={<Radio />} label={tab.name} />
        ))}
      </RadioGroup>
    );
  }

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <Typography variant='h5'>{propsToUse.label}</Typography>
      {searchCategoriesComp}
      <TabContext value={currentTabId}>
        <Tabs style={{ display: 'none' }} value={currentTabId} onChange={(e, newValue) => setCurrentTabId(newValue)}>
          {tabItems.map(tab => (
            <Tab key={tab.id} label={tab.name} value={tab.id} />
          ))}
        </Tabs>
        {tabItems.map(tab => (
          <TabPanel style={{ padding: '0px' }} key={tab.id} value={tab.id}>
            <div className='search-form'>{tab.content}</div>
          </TabPanel>
        ))}
      </TabContext>
      <Dialog open={open} onClose={onDialogClose}>
        <DialogTitle>{getLocaleValue('Discard selections?', 'DataReference')}</DialogTitle>
        <DialogContent>
          <div>{getLocaleValue('When changing search categories, any previous selections will be lost.', 'DataReference')}</div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onDialogClose} variant='outlined' color='primary'>
            {getLocaleValue('Go back', 'ModalContainer')}
          </Button>
          <Button onClick={clearSelectionAndSwitchTab} variant='contained' color='primary'>
            {getLocaleValue('Discard', 'ModalContainer')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchForm;
