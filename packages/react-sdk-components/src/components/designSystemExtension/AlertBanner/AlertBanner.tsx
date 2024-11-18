import { Alert } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

// AlertBanner is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface AlertBannerProps {
  // If any, enter additional props that only exist on Date here
  id: string;
  variant: string;
  messages: string[];
  onDismiss?: any;
}

const SEVERITY_MAP = {
  urgent: 'error',
  warning: 'warning',
  success: 'success',
  info: 'info'
};

export default function AlertBanner(props: AlertBannerProps) {
  const { id, variant, messages, onDismiss } = props;
  let additionalProps = {};

  if (onDismiss) {
    additionalProps = {
      onClose: onDismiss
    };
  }

  return (
    <div id={id}>
      {messages.map(message => (
        <Alert key={uuidv4()} variant='outlined' severity={SEVERITY_MAP[variant]} {...additionalProps}>
          {message}
        </Alert>
      ))}
    </div>
  );
}
