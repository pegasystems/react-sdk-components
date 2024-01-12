import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

// FieldGroupProps is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface FieldGroupProps {
  // If any, enter additional props that only exist on this component
  children: any[] | any;
  name: string | object;
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
  }
}));

export default function FieldGroup(props: FieldGroupProps) {
  const { children, name } = props;
  const classes = useStyles();

  const descAndChildren = (
    <Grid container>
      <div className={classes.fullWidth}>{children}</div>
    </Grid>
  );

  return (
    <Grid container spacing={4} justifyContent='space-between'>
      <Grid item style={{ width: '100%' }}>
        {name && (
          <div className={classes.fieldMargin}>
            <b>{props.name}</b>
          </div>
        )}
        {descAndChildren}
      </Grid>
    </Grid>
  );
}
