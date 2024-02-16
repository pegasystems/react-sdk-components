import { PropsWithChildren, ReactElement } from 'react';
import { PConnProps } from '../../../../types/PConnProps';
import './NarrowWideForm.css';

interface NarrowWideFormProps extends PConnProps {
  // If any, enter additional props that only exist on this component
}

export default function NarrowWideForm(props: PropsWithChildren<NarrowWideFormProps>) {
  const { children } = props;

  return (
    <>
      {children && (children as ReactElement[]).length === 2 && (
        <div className='psdk-narrow-wide-column'>
          <div className='psdk-narrow-column-column'>{children[0]}</div>
          <div className='psdk-wide-column-column'>{children[1]}</div>
        </div>
      )}
    </>
  );
}
