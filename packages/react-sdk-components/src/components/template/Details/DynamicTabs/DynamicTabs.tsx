import React, { Children, useState, useMemo } from 'react';
import { makeStyles, Tab, Tabs } from '@material-ui/core';
import { TabContext, TabPanel } from '@material-ui/lab';
import { buildView } from '../../../helpers/field-group-utils';
// import type { PConnProps } from '../../../../types/PConnProps';

const useStyles = makeStyles(() => ({
  tab: {
    minWidth: '72px'
  }
}));

// ListViewProps can't be used until getComponentConfig is NOT private
// interface DynamicTabsProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
//   showLabel: boolean;
//   label: string;
//   referenceList?: Array<any>;
// }

function DynamicTabs(props /*: DynamicTabsProps */) {
  const classes = useStyles();
  const { referenceList, showLabel, label, getPConnect } = props;
  const pConnect = getPConnect();
  // Get the inherited props from the parent to determine label settings
  const propsToUse = { label, showLabel, ...pConnect.getInheritedProps() };
  const defaultTabIndex = 0;
  const { tablabel } = pConnect.getComponentConfig();
  const tablabelProp = PCore.getAnnotationUtils().getPropertyName(tablabel);
  const referenceListData = pConnect.getValue(`${referenceList}.pxResults`, ''); // 2nd arg empty string until typedefs properly allow optional
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
      {propsToUse.label && <h3 id="dynamic-tabs-title">{propsToUse.label}</h3>}
      <TabContext value={panelShown.toString()}>
        <Tabs onChange={handleTabClick} value={panelShown} variant="scrollable" scrollButtons="auto" indicatorColor="primary" id="dynamic-tabs">
          {tabItems.map((tab: any) => (
            <Tab key={tab.id} label={tab.name} value={tab.id} className={classes.tab} />
          ))}
        </Tabs>

        {tabItems.map((tab: any) => (
          <TabPanel key={tab.id} value={tab.id.toString()} tabIndex={+tab.id} id="dynamic-tabpanel">
            <div>{memoisedTabViews[parseInt(tab.id, 10)] || 'No content exists'}</div>
          </TabPanel>
        ))}
      </TabContext>
    </>
  );
}

export default DynamicTabs;
