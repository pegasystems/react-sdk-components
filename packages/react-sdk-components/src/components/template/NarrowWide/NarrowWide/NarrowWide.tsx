import type { PropsWithChildren, ReactElement } from 'react';
import type { PConnProps } from '../../../../types/PConnProps';
import './NarrowWide.css';

interface NarrowWideProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  a: any;
  b: any;
  // eslint-disable-next-line react/no-unused-prop-types
  title?: string;
  // eslint-disable-next-line react/no-unused-prop-types
  cols?: string;
  // eslint-disable-next-line react/no-unused-prop-types
  icon?: string;
}

export default function NarrowWide(props: PropsWithChildren<NarrowWideProps>) {
  // const {a, b /*, cols, icon, title */ } = props;
  const { a, b, children } = props;

  return (
    <>
      {children && (children as ReactElement[]).length === 2 && (
        <div className='psdk-narrow-wide-column'>
          <div className='psdk-narrow-column-column'>{children[0]}</div>
          <div className='psdk-wide-column-column'>{children[1]}</div>
        </div>
      )}
      {a && b && (
        <div className='psdk-narrow-wide-column'>
          <div className='psdk-narrow-column-column'>{a}</div>
          <div className='psdk-wide-column-column'>{b}</div>
        </div>
      )}
    </>
  );
}
