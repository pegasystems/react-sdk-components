import { Button } from '@mui/material';
import './WssQuickCreate.css';

// WssQuickCreate is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface WssQuickCreateProps {
  // If any, enter additional props that only exist on this component
  heading: string;
  actions?: any[];
}

export default function WssQuickCreate(props: WssQuickCreateProps) {
  const { heading, actions } = props;

  return (
    <div>
      <h1 id='quick-links-heading' className='quick-link-heading'>
        {heading}
      </h1>
      <ul id='quick-links' className='quick-link-ul-list'>
        {actions &&
          actions.map(element => {
            return (
              <li className='quick-link-list' key={element.label}>
                <Button className='quick-link-button' onClick={element.onClick}>
                  <span className='quick-link-button-span'>
                    {element.icon && <img className='quick-link-icon' src={element.icon} alt={element.label}/>}
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
