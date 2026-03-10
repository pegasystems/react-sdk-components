import { Alert, AlertTitle } from '@mui/material';
import './AlertBanner.css';

// AlertBanner is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface AlertBannerProps {
  id: string;
  variant: string;
  messages: string[];
  onDismiss?: any;
}

const VARIANT_MAP: Record<string, { severity: string; label: string }> = {
  urgent: { severity: 'error', label: 'Error' },
  warning: { severity: 'warning', label: 'Warning' },
  success: { severity: 'success', label: 'Success' },
  info: { severity: 'info', label: 'Info' }
};

function renderMessage(message: string) {
  const colonIndex = message.indexOf(':');
  if (colonIndex === -1) return message;
  return (
    <>
      <strong>{message.slice(0, colonIndex + 1)}</strong>
      {message.slice(colonIndex + 1)}
    </>
  );
}

export default function AlertBanner({ id, variant, messages, onDismiss }: AlertBannerProps) {
  const { severity, label } = VARIANT_MAP[variant] ?? VARIANT_MAP.info;
  const isMultiple = messages.length > 1;

  return (
    <div id={id}>
      <Alert variant='outlined' severity={severity as any} {...(onDismiss && { onClose: onDismiss })}>
        {isMultiple && (
          <AlertTitle className='alert-banner-title'>
            {label}
            <span className={`alert-banner-badge alert-banner-badge--${variant}`}>{messages.length}</span>
          </AlertTitle>
        )}
        {isMultiple ? (
          <ul className='alert-banner-list'>
            {messages.map(message => (
              <li key={message}>{renderMessage(message)}</li>
            ))}
          </ul>
        ) : (
          renderMessage(messages[0])
        )}
      </Alert>
    </div>
  );
}
