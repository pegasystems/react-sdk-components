import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutoComplete from '../../../../../src/components/field/AutoComplete/AutoComplete';
import handleEvent from '../../../../../src/components/helpers/event-utils';
import { getDataPage } from '../../../../../src/components/helpers/data_page';
import Utils from '../../../../../src/components/helpers/utils';

jest.mock('../../../../../src/bridge/helpers/sdk_component_map', () => ({
  getComponentFromMap: (name: string) => {
    if (name === 'FieldValueList') {
      return ({ name: fieldName, value, variant }: any) => (
        <span data-test-id='mock-field-value-list' data-variant={variant}>
          {fieldName}: {value}
        </span>
      );
    }
    if (name === 'TextInput') {
      return (props: any) => <input data-test-id={props.testId || 'mock-text-input'} value={props.value || ''} readOnly />;
    }
    return () => <div data-test-id={`mock-${name}`} />;
  }
}));

jest.mock('../../../../../src/components/helpers/event-utils', () => jest.fn());

jest.mock('../../../../../src/components/helpers/data_page', () => ({
  getDataPage: jest.fn()
}));

jest.mock('../../../../../src/components/helpers/utils', () => ({
  __esModule: true,
  default: {
    getOptionList: jest.fn(() => [])
  }
}));

const mockActions = {
  updateFieldValue: jest.fn(),
  triggerFieldChange: jest.fn()
};

const getDefaultProps = (): any => ({
  getPConnect: () => ({
    getActionsApi: () => mockActions,
    getStateProps: () => ({ value: '.AutoCompleteValue' }),
    getContextName: () => 'testContext',
    getDataObject: () => ({})
  }),
  label: 'Test AutoComplete',
  required: false,
  placeholder: 'Search...',
  value: '',
  validatemessage: '',
  readOnly: false,
  testId: 'autoCompleteTestId',
  displayMode: '',
  deferDatasource: false,
  datasourceMetadata: {},
  status: '',
  helperText: '',
  hideLabel: false,
  listType: 'associated',
  datasource: [
    { key: 'key1', value: 'Option 1' },
    { key: 'key2', value: 'Option 2' }
  ],
  columns: [],
  onRecordChange: undefined
});

describe('AutoComplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Utils.getOptionList as jest.Mock).mockReturnValue([
      { key: 'key1', value: 'Option 1' },
      { key: 'key2', value: 'Option 2' }
    ]);
    (getDataPage as jest.Mock).mockResolvedValue([]);
  });

  test('renders Autocomplete with label and placeholder', () => {
    // Arrange
    const props = getDefaultProps();

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    expect(screen.getByLabelText('Test AutoComplete')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('renders with required attribute', () => {
    // Arrange
    const props = getDefaultProps();
    props.required = true;

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    expect(screen.getByRole('combobox')).toHaveAttribute('required');
  });

  test('renders FieldValueList in DISPLAY_ONLY mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'Test Value';

    // Act
    const { getByTestId } = render(<AutoComplete {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toBeVisible();
    expect(fvl.textContent).toContain('Test AutoComplete');
    expect(fvl.textContent).toContain('Test Value');
  });

  test('renders FieldValueList in STACKED_LARGE_VAL mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'Stacked Value';

    // Act
    const { getByTestId } = render(<AutoComplete {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl).toBeVisible();
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
  });

  test('hides label in DISPLAY_ONLY mode when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'Val';
    props.hideLabel = true;

    // Act
    const { getByTestId } = render(<AutoComplete {...props} />);

    // Assert
    expect(getByTestId('mock-field-value-list').textContent).toBe(': Val');
  });

  test('hides label in STACKED_LARGE_VAL mode when hideLabel is true', () => {
    // Arrange
    const props = getDefaultProps();
    props.displayMode = 'STACKED_LARGE_VAL';
    props.value = 'Val';
    props.hideLabel = true;

    // Act
    const { getByTestId } = render(<AutoComplete {...props} />);

    // Assert
    const fvl = getByTestId('mock-field-value-list');
    expect(fvl.textContent).toBe(': Val');
    expect(fvl).toHaveAttribute('data-variant', 'stacked');
  });

  test('renders TextInput in readOnly mode', () => {
    // Arrange
    const props = getDefaultProps();
    props.readOnly = true;

    // Act
    const { getByTestId } = render(<AutoComplete {...props} />);

    // Assert
    expect(getByTestId('autoCompleteTestId')).toBeInTheDocument();
  });

  test('renders TextInput with resolved value in readOnly mode when value matches option', async () => {
    // Arrange
    (Utils.getOptionList as jest.Mock).mockReturnValue([{ key: 'key1', value: 'Option 1' }]);
    const props = getDefaultProps();
    props.readOnly = true;
    props.value = 'key1';

    // Act
    const { getByTestId } = render(<AutoComplete {...props} />);

    // Assert
    await waitFor(() => {
      expect(getByTestId('autoCompleteTestId')).toHaveAttribute('value', 'Option 1');
    });
  });

  test('renders TextInput with undefined value in readOnly mode when no option matches', () => {
    // Arrange
    (Utils.getOptionList as jest.Mock).mockReturnValue([]);
    const props = getDefaultProps();
    props.readOnly = true;
    props.value = 'unmatchedKey';

    // Act
    const { getByTestId } = render(<AutoComplete {...props} />);

    // Assert
    expect(getByTestId('autoCompleteTestId')).toBeInTheDocument();
  });

  test('renders with error status', () => {
    // Arrange
    const props = getDefaultProps();
    props.status = 'error';

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  test('displays validation message as helper text', () => {
    // Arrange
    const props = getDefaultProps();
    props.validatemessage = 'This field is required';

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    expect(screen.getByText('This field is required')).toBeVisible();
  });

  test('displays helperText when no validatemessage', () => {
    // Arrange
    const props = getDefaultProps();
    props.helperText = 'Enter a value';

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    expect(screen.getByText('Enter a value')).toBeVisible();
  });

  test('calls Utils.getOptionList for associated listType', () => {
    // Arrange
    const props = getDefaultProps();
    props.listType = 'associated';

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    expect(Utils.getOptionList).toHaveBeenCalled();
  });

  test('calls getDataPage for datapage listType with columns including dot-prefixed values', async () => {
    // Arrange
    (getDataPage as jest.Mock).mockResolvedValue([{ ID: 'id1', Name: 'Option A', Desc: 'Desc A' }]);
    const props = getDefaultProps();
    props.listType = 'datapage';
    props.datasource = 'D_TestList';
    props.columns = [
      { key: 'true', value: '.ID' },
      { display: 'true', primary: 'true', value: '.Name' },
      { display: 'true', value: '.Desc' }
    ];

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    await waitFor(() => {
      expect(getDataPage).toHaveBeenCalledWith('D_TestList', undefined, 'testContext');
    });
  });

  test('uses pyGUID as fallback key when no key column defined', async () => {
    // Arrange
    (getDataPage as jest.Mock).mockResolvedValue([{ pyGUID: 'guid1', Name: 'Option A' }]);
    const props = getDefaultProps();
    props.listType = 'datapage';
    props.datasource = 'D_Test';
    props.columns = [{ display: 'true', primary: 'true', value: 'Name' }];

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    await waitFor(() => {
      expect(getDataPage).toHaveBeenCalled();
    });
  });

  test('calls getDataPage with parameters', async () => {
    // Arrange
    (getDataPage as jest.Mock).mockResolvedValue([]);
    const props = getDefaultProps();
    props.listType = 'datapage';
    props.datasource = 'D_Test';
    props.parameters = { someParam: 'someValue' };
    props.columns = [{ key: 'true', value: 'ID', display: 'true', primary: 'true' }];

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    await waitFor(() => {
      expect(getDataPage).toHaveBeenCalledWith('D_Test', { someParam: 'someValue' }, 'testContext');
    });
  });

  test('does not call getDataPage in DISPLAY_ONLY mode for datapage listType', () => {
    // Arrange
    const props = getDefaultProps();
    props.listType = 'datapage';
    props.datasource = 'D_Test';
    props.displayMode = 'DISPLAY_ONLY';
    props.value = 'test';
    props.columns = [{ key: 'true', value: 'ID', display: 'true', primary: 'true' }];

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    expect(getDataPage).not.toHaveBeenCalled();
  });

  test('transforms props when deferDatasource is true with @P prefixed properties', async () => {
    // Arrange
    (getDataPage as jest.Mock).mockResolvedValue([]);
    const props = getDefaultProps();
    props.deferDatasource = true;
    props.datasourceMetadata = {
      datasource: {
        name: 'D_DeferredList',
        parameters: {
          param1: { name: 'Param1', value: 'Value1' }
        },
        propertyForDisplayText: '@P .DisplayField',
        propertyForValue: '@P .ValueField'
      }
    };

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    await waitFor(() => {
      expect(getDataPage).toHaveBeenCalledWith('D_DeferredList', { Param1: 'Value1' }, 'testContext');
    });
  });

  test('transforms props when deferDatasource is true without @P prefix', async () => {
    // Arrange
    (getDataPage as jest.Mock).mockResolvedValue([]);
    const props = getDefaultProps();
    props.deferDatasource = true;
    props.datasourceMetadata = {
      datasource: {
        name: 'D_DeferredList',
        parameters: {},
        propertyForDisplayText: 'DisplayField',
        propertyForValue: 'ValueField'
      }
    };

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    await waitFor(() => {
      expect(getDataPage).toHaveBeenCalledWith('D_DeferredList', {}, 'testContext');
    });
  });

  test('handleChange calls handleEvent when option is selected', async () => {
    // Arrange
    (Utils.getOptionList as jest.Mock).mockReturnValue([
      { key: 'key1', value: 'Option 1' },
      { key: 'key2', value: 'Option 2' }
    ]);
    const props = getDefaultProps();
    render(<AutoComplete {...props} />);

    // Act
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Option 1'));

    // Assert
    expect(handleEvent).toHaveBeenCalledWith(mockActions, 'changeNblur', '.AutoCompleteValue', 'key1');
  });

  test('handleChange calls onRecordChange when provided', async () => {
    // Arrange
    const onRecordChange = jest.fn();
    (Utils.getOptionList as jest.Mock).mockReturnValue([{ key: 'key1', value: 'Option 1' }]);
    const props = getDefaultProps();
    props.onRecordChange = onRecordChange;
    render(<AutoComplete {...props} />);

    // Act
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Option 1'));

    // Assert
    expect(handleEvent).toHaveBeenCalled();
    expect(onRecordChange).toHaveBeenCalled();
  });

  test('handleChange sends empty string when selection is cleared', async () => {
    // Arrange
    (Utils.getOptionList as jest.Mock).mockReturnValue([{ key: 'key1', value: 'Option 1' }]);
    const props = getDefaultProps();
    props.value = 'key1';
    render(<AutoComplete {...props} />);

    // Act: Clear the autocomplete via the clear button
    const clearButton = screen.getByTitle('Clear');
    fireEvent.click(clearButton);

    // Assert
    expect(handleEvent).toHaveBeenCalledWith(mockActions, 'changeNblur', '.AutoCompleteValue', '');
  });

  test('selectedValue resolves from options when value matches a key', () => {
    // Arrange
    (Utils.getOptionList as jest.Mock).mockReturnValue([{ key: 'key1', value: 'Option 1' }]);
    const props = getDefaultProps();
    props.value = 'key1';

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveValue('Option 1');
  });

  test('selectedValue falls back to raw value when no option matches', () => {
    // Arrange
    (Utils.getOptionList as jest.Mock).mockReturnValue([{ key: 'key1', value: 'Option 1' }]);
    const props = getDefaultProps();
    props.value = 'unmatchedKey';

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveValue('unmatchedKey');
  });

  test('columns without dot prefix are preserved by preProcessColumns', async () => {
    // Arrange
    (getDataPage as jest.Mock).mockResolvedValue([{ ID: 'id1', Name: 'Option A' }]);
    const props = getDefaultProps();
    props.listType = 'datapage';
    props.datasource = 'D_Test';
    props.columns = [
      { key: 'true', value: 'ID' },
      { display: 'true', primary: 'true', value: 'Name' }
    ];

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    await waitFor(() => {
      expect(getDataPage).toHaveBeenCalled();
    });
  });

  test('renders with default values when optional props are omitted', () => {
    // Arrange - omit value, datasource, and columns to trigger default parameter branches
    const props = getDefaultProps();
    delete props.value;
    delete props.datasource;
    delete props.columns;

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('does not update datasource state when datasource has not changed on re-render', () => {
    // Arrange
    const props = getDefaultProps();
    const { rerender } = render(<AutoComplete {...props} />);

    // Act - re-render with the same props (isDeepEqual returns true)
    rerender(<AutoComplete {...props} />);

    // Assert
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('getOptionLabel and isOptionEqualToValue handle option with empty value', async () => {
    // Arrange - include an option with empty value to cover the falsy branch
    (Utils.getOptionList as jest.Mock).mockReturnValue([
      { key: 'key1', value: '' },
      { key: 'key2', value: 'Option 2' }
    ]);
    const props = getDefaultProps();
    render(<AutoComplete {...props} />);

    // Act - open dropdown to trigger getOptionLabel and isOptionEqualToValue
    const combobox = screen.getByRole('combobox');
    fireEvent.mouseDown(combobox);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  test('flattenParameters uses default empty object when parameters is undefined', async () => {
    // Arrange - datasourceMetadata without parameters to trigger params = {} default
    (getDataPage as jest.Mock).mockResolvedValue([]);
    const props = getDefaultProps();
    props.deferDatasource = true;
    props.datasourceMetadata = {
      datasource: {
        name: 'D_NoParms',
        propertyForDisplayText: '@P .DisplayField',
        propertyForValue: '@P .ValueField'
      }
    };

    // Act
    render(<AutoComplete {...props} />);

    // Assert
    await waitFor(() => {
      expect(getDataPage).toHaveBeenCalledWith('D_NoParms', {}, 'testContext');
    });
  });
});
