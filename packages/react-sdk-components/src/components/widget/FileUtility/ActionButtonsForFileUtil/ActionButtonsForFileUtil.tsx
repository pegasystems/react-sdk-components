import { Button } from '@mui/material';
import type { PConnProps } from '../../../../types/PConnProps';
import './ActionButtonsForFileUtil.css';

interface ActionButtonsForFileUtilProps extends PConnProps {
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
