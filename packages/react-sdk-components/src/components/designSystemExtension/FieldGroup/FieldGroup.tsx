import { type PropsWithChildren, useState } from 'react';
import Grid2 from '@mui/material/Grid2';
import makeStyles from '@mui/styles/makeStyles';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// FieldGroupProps is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface FieldGroupProps {
  // If any, enter additional props that only exist on this component
  name?: string;
  collapsible?: boolean;
  instructions?: string;
}

const useStyles = makeStyles((theme) => ({
  root: {
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  fieldMargin: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginTop: theme.spacing(1)
  },
  fullWidth: {
    width: '100%'
  },
  fieldGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: (collapsible) => (collapsible ? 'pointer' : 'auto')
  },
  instructionText: {
    padding: '5px 0'
  }
}));

export default function FieldGroup(props: PropsWithChildren<FieldGroupProps>) {
  const { children, name, collapsible = false, instructions } = props;
  const classes = useStyles(collapsible);
  const [collapsed, setCollapsed] = useState(false);

  const descAndChildren = (
    <Grid2 container>
      <div className={classes.fullWidth}>{children}</div>
    </Grid2>
  );

  const headerClickHandler = () => {
    setCollapsed((current) => !current);
  };

  return (
    <Grid2 container spacing={4} justifyContent='space-between'>
      <Grid2 style={{ width: '100%' }}>
        {name && (
          <div className={classes.fieldMargin}>
            {collapsible ? (
              <span id='field-group-header' className={classes.fieldGroupHeader} onClick={headerClickHandler}>
                {collapsed ? <KeyboardArrowRightIcon /> : <KeyboardArrowDownIcon />}
                <b>{name}</b>
              </span>
            ) : (
              <b>{name}</b>
            )}
          </div>
        )}
        {instructions && instructions !== 'none' && (
          <div key='instructions' className={classes.instructionText} dangerouslySetInnerHTML={{ __html: instructions }} />
        )}
        {!collapsed && descAndChildren}
      </Grid2>
    </Grid2>
  );
}
