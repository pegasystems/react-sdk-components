import { PropsWithChildren, ReactElement } from 'react';
import { PConnProps } from 'packages/react-sdk-components/src/types/PConnProps';
import './WideNarrow.css';

interface WideNarrowProps extends PConnProps {
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

export default function WideNarrow(props: PropsWithChildren<WideNarrowProps>) {
  // const {a, b /*, cols, icon, title */ } = props;
  const { a, b, children = [] } = props;

  return (
    <>
      {children && (children as ReactElement[]).length === 2 && (
        <div className='psdk-wide-narrow-column'>
          <div className='psdk-wide-column-column'>{children[0]}</div>
          <div className='psdk-narrow-column-column'>{children[1]}</div>
        </div>
      )}
      {a && b && (
        <div className='psdk-wide-narrow-column'>
          <div className='psdk-wide-column-column'>{a}</div>
          <div className='psdk-narrow-column-column'>{b}</div>
        </div>
      )}
    </>
  );
}
