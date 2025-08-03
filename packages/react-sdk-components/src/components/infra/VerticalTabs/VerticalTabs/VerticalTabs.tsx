import React, { useState, useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Tabs from '@mui/material/Tabs';

import LazyLoad from '../../../../bridge/LazyLoad';

// VerticalTabs does NOT have getPConnect. So, no need to extend from PConnProps
interface VerticalTabsProps {
  // If any, enter additional props that only exist on this component
  tabconfig: any[];
}

// The MuiTabs-indicator class is in a span whose parent is div (under the Tabs root component)
//  So, we're going to make the selected vertical tab indicator use a color from our theme.
const useStyles = makeStyles(theme => ({
  tabs: {
    '& div > span': {
      backgroundColor: theme.palette.info.dark,
      width: '3px'
    }
  }
}));

// Implementation of custom event inspired by:
//  https://betterprogramming.pub/master-your-react-skills-with-event-listeners-ebc01dde4fad
const createCustomEvent = (eventName: string, additionalData: { [key: string]: string }): CustomEvent | null => {
  if (window) {
    return new CustomEvent(eventName, {
      detail: { additionalData }
    });
  }

  return null;
};

export default function VerticalTabs(props: VerticalTabsProps) {
  // Get a React warning when we use tabConfig as mixed case. So all lowercase tabconfig
  const { tabconfig = [] } = props;
  const classes = useStyles();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const eventData = { itemClicked: value.toString() };
    const myEvent = createCustomEvent('VerticalTabClick', eventData);

    if (myEvent !== null) {
      document.dispatchEvent(myEvent);
    }
  }, [value]);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div id='VerticalTabs'>
      {/* VerticalTabs: {JSON.stringify(tabconfig)} */}
      <Tabs className={classes.tabs} orientation='vertical' value={value} onChange={handleChange}>
        {tabconfig.map(tab => (
          <LazyLoad componentName='LeftAlignVerticalTab' {...props} label={tab.name} key={tab.name} />
        ))}
      </Tabs>
    </div>
  );
}
