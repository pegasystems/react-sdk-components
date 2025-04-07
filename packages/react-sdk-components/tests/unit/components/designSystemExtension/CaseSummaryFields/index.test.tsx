import React from 'react';
import { getByDisplayValue, render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CaseSummaryFields from '../../../../../src/components/designSystemExtension/CaseSummaryFields';
import { getComponentFromMap } from '../../../../../src/bridge/helpers/sdk_component_map';
jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: jest.fn(() => <div data-test-id='operator'>Operator</div>)
}));


interface CaseSummaryFieldsProps {
  status?: string;
  showStatus?: boolean;
  theFields: any[] | any | never;
}

const getDefaultProps = (): CaseSummaryFieldsProps => ({
  status: 'Active',
  showStatus: true,
  theFields: [
    { type: 'textinput', config: { value: 'Test Text', label: 'Text Input' } },
    { type: 'status', config: { value: 'Active', label: 'Status' } },
    { type: 'email', config: { value: 'test@example.com', label: 'Email' } }
  ]
});

describe('CaseSummaryFields Component', () => {
  test('renders with fields', () => {
    const props = getDefaultProps();
    const { getByText, getByDisplayValue } = render(<CaseSummaryFields {...props} />);
    expect(getByText('Text Input')).toBeVisible();
    expect(getByDisplayValue('Active')).toBeVisible();
    expect(getByDisplayValue('test@example.com')).toBeVisible();
  });

  // test('renders with correct field types', () => {
  //   const props = getDefaultProps();
  //   const { getByText } = render(<CaseSummaryFields {...props} />);
  //   expect(getByText('Text Input')).toBeVisible();
  //   expect(getByText('Active')).toBeVisible();
  //   expect(getByText('test@example.com')).toBeVisible();
  // });

  test('handles showStatus prop correctly', () => {
    const props = getDefaultProps();
    props.showStatus = true;
    const { getByText, getByDisplayValue } = render(<CaseSummaryFields {...props} />);
    expect(getByText('Status')).toBeVisible();
    expect(getByDisplayValue('Active')).toBeVisible();
  });

  // test('renders without status when showStatus is false', () => {
  //   const props = getDefaultProps();
  //   props.showStatus = false;
  //   const { queryByText } = render(<CaseSummaryFields {...props} />);
  //   expect(queryByText('Status')).toBeNull();
  // });

  test('renders with different field values', () => {
    const props = getDefaultProps();
    props.theFields = [
      { type: 'textinput', config: { value: 'New Text', label: 'Text Input' } },
      { type: 'email', config: { value: 'new@example.com', label: 'Email' } }
    ];
    const { getByDisplayValue } = render(<CaseSummaryFields {...props} />);
    expect(getByDisplayValue('New Text')).toBeVisible();
    expect(getByDisplayValue('new@example.com')).toBeVisible();
  });
});
