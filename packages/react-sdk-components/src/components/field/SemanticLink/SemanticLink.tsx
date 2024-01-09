import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';

/* although this is called the SemanticLink component, we are not yet displaying as a
SemanticLink in SDK and only showing the value as a read only text field. */

const useStyles = makeStyles((theme) => ({
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
  fieldMargin: {
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
    fontWeight: 400,
    color: theme.palette.text.secondary
  },
  fieldValue: {
    fontWeight: 400,
    color: theme.palette.text.primary
  }
}));

interface SemanticLinkProps extends PConnFieldProps {
  // If any, enter additional props that only exist on SemanticLink here
  // from previous PropTypes
  text: string;
}

export default function SemanticLink(props: SemanticLinkProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');

  const { text, displayMode, label, hideLabel } = props;
  const classes = useStyles();

  if (displayMode === 'LABELS_LEFT' || (!displayMode && label !== undefined)) {
    const value = text || '---';
    return (
      <Grid container spacing={1} style={{ padding: '4px 0px' }} id="semantic-link-grid">
        <Grid item xs={6}>
          <Typography variant="body2" component="span" className={`${classes.fieldLabel} ${classes.fieldMargin}`}>
            {label}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" component="span" className={classes.fieldValue}>
            {value}
          </Typography>
        </Grid>
      </Grid>
    );
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={text} variant="stacked" />;
  }
}
