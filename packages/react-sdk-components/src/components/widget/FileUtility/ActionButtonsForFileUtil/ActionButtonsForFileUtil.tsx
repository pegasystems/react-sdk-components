import { Button } from '@material-ui/core';
import './ActionButtonsForFileUtil.css';

// ActionButtonsForFileUtil does NOT have getPConnect.
//  So, no need to extend PConnProps

interface ActionButtonsForFileUtilProps {
  // If any, enter additional props that only exist on this component
  arMainButtons: any[];
  arSecondaryButtons: any[];
  primaryAction: any;
  secondaryAction: any;
}

export default function ActionButtonsForFileUtil(props: ActionButtonsForFileUtilProps) {
  return (
    <div className='psdk-actions'>
      <div className='psdk-action-buttons'>
        {props.arSecondaryButtons.map(file => (
          <Button className='secondary-button' key={file.actionID} onClick={props.secondaryAction}>
            {file.name}
          </Button>
        ))}
      </div>
      <div className='psdk-action-buttons'>
        {props.arMainButtons.map(file => (
          <Button className='primary-button' key={file.actionID} onClick={props.primaryAction}>
            {file.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
