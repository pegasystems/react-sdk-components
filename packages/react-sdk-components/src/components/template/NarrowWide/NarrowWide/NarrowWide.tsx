import { Children, PropsWithChildren, useMemo } from 'react';
import './NarrowWide.css';

// NarrowWide does NOT have getPConnect. So, no need to extend from PConnProps
interface NarrowWideProps {
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

  const childArray = useMemo(() => {
    return Children.toArray(children);
  }, [children]);

  return (
    <>
      {childArray && childArray.length === 2 && (
        <div className='psdk-narrow-wide-column'>
          <div className='psdk-narrow-column-column'>{childArray[0]}</div>
          <div className='psdk-wide-column-column'>{childArray[1]}</div>
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
