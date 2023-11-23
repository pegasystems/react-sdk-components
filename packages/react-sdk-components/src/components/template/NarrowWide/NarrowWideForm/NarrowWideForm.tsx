import React from "react";

import './NarrowWideForm.css';

// NarrowWideForm does NOT have getPConnect. So, no need to extend from PConnProps

interface NarrowWideFormProps {
  // If any, enter additional props that only exist on this component
  children: Array<any>
}


export default function NarrowWideForm(props: NarrowWideFormProps) {
  const {children} = props;

  return (
    <React.Fragment>
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
    </React.Fragment>

  )

}
