import { Button } from '@mui/material';
import './WssQuickCreate.css';
import { makeStyles } from '@mui/styles';

// WssQuickCreate is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface WssQuickCreateProps {
  // If any, enter additional props that only exist on this component
  heading: string;
  actions?: any[];
}

const useStyles = makeStyles(theme => ({
  quickLinkList: {
    backgroundColor: theme.palette.mode === 'dark' ? 'var(--app-background-color)' : 'var(--link-button-color)',
    color: 'var(--app-text-color)',
    borderRadius: '16px',
    border: '1px solid var(--app-primary-color)'
  }
}));

export default function WssQuickCreate(props: WssQuickCreateProps) {
  const { heading, actions } = props;
  const classes = useStyles();
  return (
    <div>
      <h1 id='quick-links-heading' className='quick-links-heading'>
        {heading}
      </h1>
      <ul id='quick-links' className='quick-link-ul-list'>
        {actions &&
          actions.map(element => {
            return (
              <li className={classes.quickLinkList} key={element.label}>
                <Button className='quick-link-button' onClick={element.onClick}>
                  <span className='quick-link-button-span'>
                    {element.icon && <img className='quick-link-icon' src={element.icon} />}
                    <span>{element.label}</span>
                  </span>
                </Button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
