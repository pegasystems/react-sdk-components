import { useState, useEffect } from 'react';
import styled from 'styled-components';

import handleEvent from '../../helpers/event-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnFieldProps } from '../../../types/PConnProps';

// ---------------------------------------------------------------------------
// Northwestern Mutual "Luna" design tokens
// Source: login.northwesternmutual.com/registration (luna design system CSS)
// ---------------------------------------------------------------------------
const NM = {
  navy: '#1f2d46',
  border: '#5c697f',
  borderHover: '#1f2d46',
  focusBlue: '#2d4dc5',
  errorRed: '#c93939',
  errorRedDark: '#b52828',
  placeholder: '#9ba7bc',
  labelColor: '#5c697f',
  textColor: '#1f2d46',
  surface: '#f7f9fc',
  helperText: '#5c697f',
  disabledOpacity: '0.5',
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontSize: '1rem',
  labelFontSize: '0.875rem',
  helperFontSize: '0.75rem',
  lineHeight: '1.5',
  borderRadius: '0', // Luna uses flat bottom-border inputs
  transitionSpeed: '0.2s',
};

// --- Styled primitives -------------------------------------------------------

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: ${NM.fontFamily};
`;

const Label = styled.label<{ $required?: boolean; $hasError?: boolean }>`
  font-size: ${NM.labelFontSize};
  font-weight: 500;
  color: ${({ $hasError }) => ($hasError ? NM.errorRed : NM.labelColor)};
  margin-bottom: 0.375rem;
  letter-spacing: 0.01em;

  ${({ $required }) =>
    $required &&
    `
    &::after {
      content: ' *';
      color: ${NM.errorRed};
    }
  `}
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

// Luna inputs: no full border box — only a bottom border that animates on focus/error
const StyledInput = styled.input<{ $hasError?: boolean; $readOnly?: boolean }>`
  width: 100%;
  font-family: ${NM.fontFamily};
  font-size: ${NM.fontSize};
  line-height: ${NM.lineHeight};
  color: ${NM.textColor};
  background-color: ${NM.surface};
  border: none;
  border-bottom: 1px solid ${({ $hasError }) => ($hasError ? NM.errorRed : NM.border)};
  border-radius: ${NM.borderRadius};
  padding: 0.625rem 0.75rem;
  outline: none;
  transition:
    border-bottom-color ${NM.transitionSpeed} ease,
    box-shadow ${NM.transitionSpeed} ease;
  cursor: ${({ $readOnly }) => ($readOnly ? 'default' : 'text')};

  &::placeholder {
    color: ${NM.placeholder};
    opacity: 1;
  }

  &:hover:not(:disabled):not([readonly]) {
    border-bottom-color: ${({ $hasError }) => ($hasError ? NM.errorRedDark : NM.borderHover)};
  }

  &:focus:not([readonly]) {
    border-bottom-color: ${({ $hasError }) => ($hasError ? NM.errorRed : NM.focusBlue)};
    box-shadow: 0 1px 0 0 ${({ $hasError }) => ($hasError ? NM.errorRed : NM.focusBlue)};
  }

  &:disabled {
    opacity: ${NM.disabledOpacity};
    cursor: not-allowed;
    background-color: ${NM.surface};
  }

  &[readonly] {
    background-color: transparent;
    border-bottom-style: dashed;
    cursor: default;
  }
`;

const HelperText = styled.span<{ $hasError?: boolean }>`
  font-size: ${NM.helperFontSize};
  color: ${({ $hasError }) => ($hasError ? NM.errorRed : NM.helperText)};
  margin-top: 0.25rem;
  line-height: 1.4;
`;

// ---------------------------------------------------------------------------

interface TextInputProps extends PConnFieldProps {
  // If any, enter additional props that only exist on TextInput here
  fieldMetadata?: any;
}

export default function TextInput(props: TextInputProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const FieldValueList = getComponentFromMap('FieldValueList');

  const {
    getPConnect,
    label,
    required,
    disabled,
    value = '',
    validatemessage,
    status,
    readOnly,
    testId,
    fieldMetadata,
    helperText,
    displayMode,
    hideLabel,
    placeholder
  } = props;

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName = (pConn.getStateProps() as any).value;

  const helperTextToDisplay = validatemessage || helperText;
  const hasError = status === 'error';

  const [inputValue, setInputValue] = useState('');
  const maxLength = fieldMetadata?.maxLength;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  if (displayMode === 'DISPLAY_ONLY') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} />;
  }

  if (displayMode === 'STACKED_LARGE_VAL') {
    return <FieldValueList name={hideLabel ? '' : label} value={value} variant='stacked' />;
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
  }

  function handleBlur() {
    handleEvent(actions, 'changeNblur', propName, inputValue);
  }

  const inputId = `nm-input-${testId ?? propName ?? label}`;

  return (
    <Wrapper>
      {!hideLabel && label && (
        <Label htmlFor={inputId} $required={required} $hasError={hasError}>
          {label}
        </Label>
      )}
      <InputWrapper>
        <StyledInput
          id={inputId}
          type='text'
          value={inputValue}
          placeholder={placeholder ?? ''}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          $hasError={hasError}
          $readOnly={readOnly}
          onChange={handleChange}
          onBlur={!readOnly ? handleBlur : undefined}
          data-test-id={testId}
          aria-invalid={hasError}
          aria-describedby={helperTextToDisplay ? `${inputId}-helper` : undefined}
        />
      </InputWrapper>
      {helperTextToDisplay && (
        <HelperText id={`${inputId}-helper`} $hasError={hasError} role={hasError ? 'alert' : undefined}>
          {helperTextToDisplay}
        </HelperText>
      )}
    </Wrapper>
  );
}

