import React, { createElement, isValidElement } from 'react';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';

import createPConnectComponent from '../../../bridge/react_pconnect';
import { format } from '../../helpers/formatters';

// DetailsFields is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface DetailsFieldsProps {
  // If any, enter additional props that only exist on this component
  fields: any[];
}

const useStyles = makeStyles(theme => ({
  root: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  fieldLabel: {
    display: 'block',
    fontWeight: 400,
    color: theme.palette.text.secondary
  },
  fieldValue: {
    fontWeight: 400,
    color: theme.palette.text.primary
  }
}));

export default function DetailsFields(props: DetailsFieldsProps) {
  // const componentName = "DetailsFields";
  const { fields = [] } = props;
  const classes = useStyles();
  const fieldComponents: any[] = [];

  fields?.forEach((field, index) => {
    const thePConn = field.getPConnect();
    const theCompType = thePConn.getComponentName().toLowerCase();
    const { label } = thePConn.getConfigProps();
    const configObj = thePConn?.getReferencedView();
    configObj.config.readOnly = true;
    configObj.config.displayMode = 'DISPLAY_ONLY';
    const propToUse = { ...thePConn.getInheritedProps() };
    configObj.config.label = theCompType === 'reference' ? propToUse?.label : label;
    fieldComponents.push({
      type: theCompType,
      label,
      value: <React.Fragment key={index}>{createElement(createPConnectComponent(), thePConn.getReferencedViewPConnect())}</React.Fragment>
    });
  });

  function getGridItemLabel(field: any, keyVal: string) {
    const dispValue = field.label;

    return (
      <Grid2 size={{ xs: 6 }} key={keyVal}>
        <Typography variant='body2' component='span' className={`${classes.fieldLabel}`}>
          {dispValue}
        </Typography>
      </Grid2>
    );
  }

  function formatItemValue(inField: any) {
    const { type, value } = inField;
    let formattedVal = value;

    switch (type) {
      case 'date':
        formattedVal = format(value, type);
        break;

      default:
        // No match means we return the value as we received it
        break;
    }

    // Finally, if the value is undefined or an empty string, we want to display it as "---"
    if (formattedVal === undefined || formattedVal === '') {
      formattedVal = '---';
    }

    return formattedVal;
  }

  function getGridItemValue(field: any, keyVal: string) {
    const formattedValue = formatItemValue(field);

    return (
      <Grid2 size={{ xs: 6 }} key={keyVal}>
        <Typography variant='body2' component='span' className={classes.fieldValue}>
          {formattedValue}
        </Typography>
      </Grid2>
    );
  }

  function getGridItem(field: any, keyVal: string) {
    return (
      <Grid2 size={{ xs: 12 }} key={keyVal}>
        <Typography variant='body2' component='span' className={classes.fieldValue}>
          {field?.value}
        </Typography>
      </Grid2>
    );
  }

  function getGridItems() {
    const gridItems: any[] = fieldComponents.map((field, index) => {
      if (field?.type === 'reference') {
        return field?.value;
      }
      if (isValidElement(field?.value)) {
        return (
          <Grid2 container spacing={1} style={{ padding: '4px 0px' }} key={index}>
            {getGridItem(field, `${index}-item`)}
          </Grid2>
        );
      }
      return (
        <Grid2 container spacing={1} style={{ padding: '4px 0px' }} key={index}>
          {getGridItemLabel(field, `${index}-label`)}
          {getGridItemValue(field, `${index}-value`)}
        </Grid2>
      );
    });
    return gridItems;
  }

  return <>{getGridItems()}</>;
}
