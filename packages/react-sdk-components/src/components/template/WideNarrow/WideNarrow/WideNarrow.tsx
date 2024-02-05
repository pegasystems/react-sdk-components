import { Children, PropsWithChildren, useMemo } from 'react';
import './WideNarrow.css';

// WideNarrow does NOT have getPConnect. So, no need to extend from PConnProps
interface WideNarrowProps {
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
  const childArray = useMemo(() => {
    return Children.toArray(children);
  }, [children]);

  return (
    <>
      {childArray && childArray.length === 2 && (
        <div className='psdk-wide-narrow-column'>
          <div className='psdk-wide-column-column'>{childArray[0]}</div>
          <div className='psdk-narrow-column-column'>{childArray[1]}</div>
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
