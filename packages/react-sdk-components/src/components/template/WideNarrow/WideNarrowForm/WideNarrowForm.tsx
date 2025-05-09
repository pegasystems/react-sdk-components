import type { PropsWithChildren, ReactElement } from 'react';
import type { PConnProps } from '../../../../types/PConnProps';
import './WideNarrowForm.css';

interface WideNarrowFormProps extends PConnProps {
  // If any, enter additional props that only exist on this component
}

export default function WideNarrowForm(props: PropsWithChildren<WideNarrowFormProps>) {
  const { children } = props;

  return (
    <>
      {children && (children as ReactElement[]).length === 2 && (
        <div className='psdk-wide-narrow-column'>
          <div className='psdk-wide-column-column'>{children[0]}</div>
          <div className='psdk-narrow-column-column'>{children[1]}</div>
        </div>
      )}
    </>
  );
}
