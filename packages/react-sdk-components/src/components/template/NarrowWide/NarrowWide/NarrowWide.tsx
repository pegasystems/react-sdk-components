import './NarrowWide.css';

// NarrowWide does NOT have getPConnect. So, no need to extend from PConnProps
interface NarrowWideProps {
  // If any, enter additional props that only exist on this component
  a: any,
  b: any,
  children?: any[],
  // eslint-disable-next-line react/no-unused-prop-types
  title?: string,
  // eslint-disable-next-line react/no-unused-prop-types
  cols?: string,
  // eslint-disable-next-line react/no-unused-prop-types
  icon?: string
}


export default function NarrowWide(props: NarrowWideProps) {
  // const {a, b /*, cols, icon, title */ } = props;
  const {a, b, children} = props;

  return (
    <>
    {children && children.length === 2 &&
      <div className="psdk-narrow-wide-column">
      <div className="psdk-narrow-column-column">
        {children[0]}
      </div>
      <div className="psdk-wide-column-column">
        {children[1]}
      </div>
    </div>
    }
    {a && b &&
      <div className="psdk-narrow-wide-column">
      <div className="psdk-narrow-column-column">
        {a}
      </div>
      <div className="psdk-wide-column-column">
        {b}
      </div>
    </div>
    }
    </>

  )

}
