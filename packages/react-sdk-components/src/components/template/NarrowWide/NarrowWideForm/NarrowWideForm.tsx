import { Children, PropsWithChildren, useMemo } from 'react';
import './NarrowWideForm.css';

// NarrowWideForm does NOT have getPConnect. So, no need to extend from PConnProps

interface NarrowWideFormProps {
  // If any, enter additional props that only exist on this component
}

export default function NarrowWideForm(props: PropsWithChildren<NarrowWideFormProps>) {
  const { children } = props;
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
    </>
  );
}
