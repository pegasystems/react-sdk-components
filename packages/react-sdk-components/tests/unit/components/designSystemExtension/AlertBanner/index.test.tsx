import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AlertBanner from '../../../../../src/components/designSystemExtension/AlertBanner/AlertBanner';

interface AlertBannerProps {
  id: string;
  variant: string;
  messages: string[];
  onDismiss?: () => void;
}

const getDefaultProps = (): AlertBannerProps => ({
  id: 'alert-banner',
  variant: 'info',
  messages: ['Test message'],
  onDismiss: jest.fn()
});

describe('AlertBanner Component', () => {
  test('renders with messages', () => {
    const props = getDefaultProps();
    const { getByText } = render(<AlertBanner {...props} />);
    expect(getByText('Test message')).toBeVisible();
  });

  test('renders with correct severity', () => {
    const props = getDefaultProps();
    props.variant = 'urgent';
    const { getByText } = render(<AlertBanner {...props} />);
    expect(getByText('Test message').closest('.MuiAlert-root')).toHaveClass('MuiAlert-outlinedError');
  });

  test('calls onDismiss when close button is clicked', () => {
    const props = getDefaultProps();
    const { getByRole } = render(<AlertBanner {...props} />);
    fireEvent.click(getByRole('button'));
    expect(props.onDismiss).toHaveBeenCalled();
  });

  test('renders without onDismiss', () => {
    const props = getDefaultProps();
    delete props.onDismiss;
    const { getByText } = render(<AlertBanner {...props} />);
    expect(getByText('Test message')).toBeVisible();
  });
});
