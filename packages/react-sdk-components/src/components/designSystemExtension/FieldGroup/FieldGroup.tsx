import { type PropsWithChildren } from 'react';
import Grid2 from '@mui/material/Grid2';
import makeStyles from '@mui/styles/makeStyles';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// FieldGroupProps is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface FieldGroupProps {
  // If any, enter additional props that only exist on this component
  heading?: string;
  instructions?: string;
  defaultCollapsed?: any;
  showHeading?: any;
  collapsed?: any;
  onToggleCollapsed?: () => void;
  isCollapsibleMode?: boolean;
}

const useStyles = makeStyles(theme => ({
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
    cursor: isCollapsibleMode => (isCollapsibleMode ? 'pointer' : 'auto')
  },
  instructionText: {
    padding: '5px 0'
  }
}));

export default function FieldGroup(props: PropsWithChildren<FieldGroupProps>) {
  const { children, heading, instructions, collapsed, showHeading, isCollapsibleMode, onToggleCollapsed } = props;
  const classes = useStyles(isCollapsibleMode);

  const descAndChildren = (
    <Grid2 container>
      <div className={classes.fullWidth}>{children}</div>
    </Grid2>
  );

  const headerClickHandler = () => {
    onToggleCollapsed?.();
  };

  return (
    <Grid2 container spacing={4} justifyContent='space-between'>
      <Grid2 style={{ width: '100%' }}>
        {heading && (
          <div className={classes.fieldMargin}>
            {isCollapsibleMode ? (
              <span id='field-group-header' className={classes.fieldGroupHeader} onClick={headerClickHandler}>
                {collapsed ? <KeyboardArrowRightIcon /> : <KeyboardArrowDownIcon />}
                <b>{heading}</b>
              </span>
            ) : showHeading ? (
              <b>{heading}</b>
            ) : null}
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
