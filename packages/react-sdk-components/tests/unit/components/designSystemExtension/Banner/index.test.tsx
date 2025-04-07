import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Banner from '../../../../../src/components/designSystemExtension/Banner';

interface BannerProps {
  a: any;
  b: any;
  banner: {
    variant: any;
    backgroundColor: any;
    title: any;
    message: any;
    backgroundImage: any;
    tintImage: any;
  };
  variant: any;
}

const getDefaultProps = (): BannerProps => ({
  a: <div>Component A</div>,
  b: <div>Component B</div>,
  banner: {
    variant: 'info',
    backgroundColor: 'blue',
    title: 'Test Title',
    message: 'Test Message',
    backgroundImage: 'test-image.jpg',
    tintImage: 'test-tint.jpg'
  },
  variant: 'two-column'
});

describe('Banner Component', () => {
  test('renders with title and message', () => {
    const props = getDefaultProps();
    const { getByText } = render(<Banner {...props} />);
    expect(getByText('Test Title')).toBeVisible();
    expect(getByText('Test Message')).toBeVisible();
  });

  test('renders with correct background image', () => {
    const props = getDefaultProps();
    const { container } = render(<Banner {...props} />);
    const backgroundImageDiv = container.querySelector('.background-image-style');
    expect(backgroundImageDiv).toHaveStyle(`background-image: url(${props.banner.backgroundImage})`);
  });

  test('renders with correct variant layout', () => {
    const props = getDefaultProps();
    props.variant = 'narrow-wide';
    const { container } = render(<Banner {...props} />);
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems[1]).toHaveClass('MuiGrid-grid-xs-4');
    expect(gridItems[2]).toHaveClass('MuiGrid-grid-xs-8');
  });

  test('renders with different components in grid', () => {
    const props = getDefaultProps();
    const { getByText } = render(<Banner {...props} />);
    expect(getByText('Component A')).toBeVisible();
    expect(getByText('Component B')).toBeVisible();
  });
});
