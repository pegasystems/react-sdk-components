import { Card, CardContent, CardHeader, Typography, CardActions, Button } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import type { PConnProps } from '../../../types/PConnProps';

interface AppAnnouncementProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  header?: string;
  description?: string;
  datasource?: any;
  whatsnewlink?: string;
}

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    borderLeft: '6px solid',
    borderLeftColor: theme.palette.primary.light,
  },
}));

export default function AppAnnouncement(props: AppAnnouncementProps) {
  const { header = '', description = '', datasource = [], whatsnewlink = '' } = props;
  let details = [];
  if (datasource && datasource.source) {
    details = datasource.source.map((item) => {
      return item.name;
    });
  }

  const classes = useStyles();

  const handleClick = () => {
    window.open(whatsnewlink);
  };

  return (
    <Card title='AppAnnouncement' className={classes.root}>
      <CardHeader title={<Typography variant='h6'>{header}</Typography>} />
      <CardContent>
        <Typography variant='body1' gutterBottom>
          {description}
        </Typography>
        {details.map((itm, idx) => {
          const theKey = `AppAnn-item-${idx}`;
          return (
            <Typography key={theKey} variant='body2'>
              - {itm}
            </Typography>
          );
        })}
      </CardContent>
      <CardActions>
        <Button color='primary' onClick={handleClick} size='small'>
          See what&apos;s new
        </Button>
      </CardActions>
    </Card>
  );
}
