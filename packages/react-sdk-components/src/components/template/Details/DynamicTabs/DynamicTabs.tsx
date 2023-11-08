import React, { Children, useState, useMemo } from 'react';
import { makeStyles, Tab, Tabs } from '@material-ui/core';
import { TabContext, TabPanel } from '@material-ui/lab';
import { buildView } from '../../../helpers/field-group-utils';

const useStyles = makeStyles(() => ({
  tab: {
    minWidth: '72px'
  }
}));

function DynamicTabs(props) {
  const classes = useStyles();
  const { referenceList, showLabel, label, getPConnect } = props;
  const pConnect = getPConnect();
  // Get the inherited props from the parent to determine label settings
  const propsToUse = { label, showLabel, ...pConnect.getInheritedProps() };
  const defaultTabIndex = 0;
  const { tablabel } = pConnect.getComponentConfig();
  const tablabelProp = PCore.getAnnotationUtils().getPropertyName(tablabel);
  const referenceListData = pConnect.getValue(`${referenceList}.pxResults`);
  const memoisedTabViews = useMemo(() => {
    pConnect.setInheritedProp('displayMode', 'LABELS_LEFT');
    pConnect.setInheritedProp('readOnly', true);

    return (
      referenceListData &&
      Children.toArray(
        referenceListData.map((item, index) => {
          return <React.Fragment key={item[tablabelProp]}>{buildView(pConnect, index, '')}</React.Fragment>;
        })
      )
    );
  }, [referenceListData]);
  const [panelShown, changePanel] = useState(defaultTabIndex);
  const handleTabClick = (e, id) => {
    changePanel(parseInt(id, 10));
  };
  // Loop over the tab contents and and pull out the labels for the navigation
  const tabItems =
    referenceListData?.map((item, i) => {
      const currentTabLabel = item[tablabelProp] || PCore.getLocaleUtils().getLocaleValue('No label specified in config', 'Generic');
      return {
        name: currentTabLabel,
        id: i
      };
    }) || [];

  return (
    <>
      {propsToUse.label && <h3>{propsToUse.label}</h3>}
      <TabContext value={panelShown.toString()}>
        <Tabs onChange={handleTabClick} value={panelShown} variant="scrollable" scrollButtons="auto" indicatorColor="primary">
          {tabItems.map((tab: any) => (
            <Tab key={tab.id} label={tab.name} value={tab.id} className={classes.tab} />
          ))}
        </Tabs>

        {tabItems.map((tab: any) => (
          <TabPanel key={tab.id} value={tab.id.toString()} tabIndex={+tab.id}>
            <div>{memoisedTabViews[parseInt(tab.id, 10)] || 'No content exists'}</div>
          </TabPanel>
        ))}
      </TabContext>
    </>
  );
}

export default DynamicTabs;
