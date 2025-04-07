import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import FieldGroupList from '../../../../../src/components/designSystemExtension/FieldGroupList';
import { Utils } from '../../../../../src/components/helpers/utils';

jest.mock('../../../../../src/components/helpers/utils', () => ({
  Utils: {
    getImageSrc: jest.fn(() => 'mocked-image-src'),
    getSDKStaticConentUrl: jest.fn(() => 'mocked-sdk-static-content-url')
  }
}));

interface FieldGroupListProps {
  items: any[] | any;
  onDelete: any;
  onAdd: any;
}

const getDefaultProps = (): FieldGroupListProps => ({
  items: [
    { id: 1, name: 'Item 1', children: <div>Child 1</div> },
    { id: 2, name: 'Item 2', children: <div>Child 2</div> }
  ],
  onDelete: jest.fn(),
  onAdd: jest.fn()
});

describe('FieldGroupList Component', () => {
  test('renders with items', () => {
    const props = getDefaultProps();
    const { getByText } = render(<FieldGroupList {...props} />);
    expect(getByText('Item 1')).toBeVisible();
    expect(getByText('Item 2')).toBeVisible();
    expect(getByText('Child 1')).toBeVisible();
    expect(getByText('Child 2')).toBeVisible();
  });

  test('handles onDelete prop correctly', () => {
    const props = getDefaultProps();
    const { getAllByLabelText, getByTestId } = render(<FieldGroupList {...props} />);
    fireEvent.click(getAllByLabelText('Delete Row')[0]);
    expect(props.onDelete).toHaveBeenCalledWith(1);
  });

  test('handles onAdd prop correctly', () => {
    const props = getDefaultProps();
    const { getByText } = render(<FieldGroupList {...props} />);
    fireEvent.click(getByText('+Add'));
    expect(props.onAdd).toHaveBeenCalled();
  });

  test('renders without onDelete button when onDelete prop is not provided', () => {
    const props = getDefaultProps();
    delete props.onDelete;
    const { queryByLabelText } = render(<FieldGroupList {...props} />);
    expect(queryByLabelText('Delete Row')).toBeNull();
  });

  test('renders without onAdd link when onAdd prop is not provided', () => {
    const props = getDefaultProps();
    delete props.onAdd;
    const { queryByText } = render(<FieldGroupList {...props} />);
    expect(queryByText('+Add')).toBeNull();
  });
});
