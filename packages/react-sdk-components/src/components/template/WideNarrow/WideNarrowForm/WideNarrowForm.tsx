import { Children, PropsWithChildren, useMemo } from 'react';
import './WideNarrowForm.css';

// WideNarrowForm does NOT have getPConnect. So, no need to extend from PConnProps
interface WideNarrowFormProps {
  // If any, enter additional props that only exist on this component
}

export default function WideNarrowForm(props: PropsWithChildren<WideNarrowFormProps>) {
  const { children } = props;
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
    </>
  );
}
