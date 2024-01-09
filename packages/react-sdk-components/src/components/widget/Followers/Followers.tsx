import { Card, CardContent, CardHeader, Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
// import { green } from "@material-ui/core/colors";

// Followers does NOT have getPConnect. So, no need to extend from PConnProps
interface FollowersProps {
  // If any, enter additional props that only exist on this component
  children: Array<any>
}


const useStyles = makeStyles((theme) => ({
  root: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    // borderLeft: "6px solid",
    // borderLeftColor: green[300]
  },
}));

export default function Followers(props: FollowersProps) {
  const componentName = "Followers";
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const { children } = props;
  const classes = useStyles();

  return (
      <Card className={classes.root}>
        <CardHeader title={<Typography variant="h6" component="div">{componentName} - <em>unsupported</em></Typography>} />
        <CardContent>
          <Typography>{componentName} content</Typography>
        </CardContent>
      </Card>
    );
}
