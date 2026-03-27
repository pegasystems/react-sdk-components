import React from 'react';
import styled, { css } from 'styled-components';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps {
  /** The status text to display */
  label: string;
  /** Visual variant controlling the color scheme */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Optional test identifier */
  testId?: string;
}

// Color map keyed by variant — avoids runtime object lookups inside template literals
const variantStyles: Record<BadgeVariant, ReturnType<typeof css>> = {
  success: css`
    background-color: #e6f4ea;
    color: #1e7e34;
    border-color: #a8d5b5;
  `,
  warning: css`
    background-color: #fff8e1;
    color: #856404;
    border-color: #ffd54f;
  `,
  error: css`
    background-color: #fdecea;
    color: #c62828;
    border-color: #ef9a9a;
  `,
  info: css`
    background-color: #e3f2fd;
    color: #0d47a1;
    border-color: #90caf9;
  `,
  neutral: css`
    background-color: #f5f5f5;
    color: #424242;
    border-color: #bdbdbd;
  `
};

const sizeStyles: Record<BadgeSize, ReturnType<typeof css>> = {
  sm: css`
    font-size: 0.65rem;
    padding: 2px 6px;
  `,
  md: css`
    font-size: 0.75rem;
    padding: 4px 10px;
  `,
  lg: css`
    font-size: 0.875rem;
    padding: 6px 14px;
  `
};

// Use transient props ($ prefix) to prevent forwarding to the DOM element
const StyledBadge = styled.span<{ $variant: BadgeVariant; $size: BadgeSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid transparent;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
  white-space: nowrap;
  ${({ $variant }) => variantStyles[$variant]}
  ${({ $size }) => sizeStyles[$size]}
`;

export default function StatusBadge({ label, variant = 'neutral', size = 'md', testId }: StatusBadgeProps) {
  return (
    <StyledBadge $variant={variant} $size={size} role='status' data-test-id={testId}>
      {label}
    </StyledBadge>
  );
}
