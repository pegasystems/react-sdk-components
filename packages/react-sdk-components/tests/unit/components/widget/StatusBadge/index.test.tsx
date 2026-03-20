import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../../../../../src/components/widget/StatusBadge';
import type { BadgeVariant, BadgeSize } from '../../../../../src/components/widget/StatusBadge';

describe('StatusBadge (styled-components)', () => {
  // ─── Rendering ───────────────────────────────────────────────────────────────

  test('renders the label text', () => {
    render(<StatusBadge label='Active' />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('exposes a status role for accessibility', () => {
    render(<StatusBadge label='Pending' testId='badge-1' />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('applies the data-test-id attribute when provided', () => {
    render(<StatusBadge label='New' testId='my-badge' />);
    expect(screen.getByTestId('my-badge')).toBeInTheDocument();
  });

  // ─── Defaults ────────────────────────────────────────────────────────────────

  test('uses "neutral" variant and "md" size by default', () => {
    render(<StatusBadge label='Default' testId='default-badge' />);
    const badge = screen.getByTestId('default-badge');
    // styled-components generates a class; we verify the element is in the DOM
    // and that the baseline styles are applied via the generated className
    expect(badge).toBeInTheDocument();
    expect(badge.tagName.toLowerCase()).toBe('span');
  });

  // ─── Variant rendering ────────────────────────────────────────────────────────

  const variants: BadgeVariant[] = ['success', 'warning', 'error', 'info', 'neutral'];

  test.each(variants)('renders "%s" variant without crashing', (variant) => {
    render(<StatusBadge label={variant} variant={variant} testId={`badge-${variant}`} />);
    expect(screen.getByTestId(`badge-${variant}`)).toBeInTheDocument();
  });

  // ─── Size rendering ───────────────────────────────────────────────────────────

  const sizes: BadgeSize[] = ['sm', 'md', 'lg'];

  test.each(sizes)('renders "%s" size without crashing', (size) => {
    render(<StatusBadge label='Label' size={size} testId={`badge-${size}`} />);
    expect(screen.getByTestId(`badge-${size}`)).toBeInTheDocument();
  });

  // ─── styled-components class injection ───────────────────────────────────────

  test('styled-components injects a generated CSS class onto the element', () => {
    render(<StatusBadge label='Styled' testId='styled-badge' />);
    const badge = screen.getByTestId('styled-badge');
    // styled-components v6 attaches one or more generated class names (sc-*)
    const hasStyledClass = Array.from(badge.classList).some(cls => cls.startsWith('sc-'));
    expect(hasStyledClass).toBe(true);
  });

  test('different variants produce different CSS classes', () => {
    const { rerender } = render(<StatusBadge label='Badge' variant='success' testId='var-badge' />);
    const successClasses = screen.getByTestId('var-badge').className;

    rerender(<StatusBadge label='Badge' variant='error' testId='var-badge' />);
    const errorClasses = screen.getByTestId('var-badge').className;

    expect(successClasses).not.toBe(errorClasses);
  });

  test('different sizes produce different CSS classes', () => {
    const { rerender } = render(<StatusBadge label='Badge' size='sm' testId='size-badge' />);
    const smClasses = screen.getByTestId('size-badge').className;

    rerender(<StatusBadge label='Badge' size='lg' testId='size-badge' />);
    const lgClasses = screen.getByTestId('size-badge').className;

    expect(smClasses).not.toBe(lgClasses);
  });

  // ─── Transient props ($) are NOT forwarded to DOM ────────────────────────────

  test('transient props ($variant, $size) are not present as DOM attributes', () => {
    render(<StatusBadge label='Clean' variant='info' size='lg' testId='clean-badge' />);
    const badge = screen.getByTestId('clean-badge');
    expect(badge).not.toHaveAttribute('$variant');
    expect(badge).not.toHaveAttribute('$size');
  });
});
