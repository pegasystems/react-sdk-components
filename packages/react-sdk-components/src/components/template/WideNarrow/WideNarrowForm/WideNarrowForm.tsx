import React from "react";

import './WideNarrowForm.css';

// WideNarrowForm does NOT have getPConnect. So, no need to extend from PConnProps
interface WideNarrowFormProps {
  // If any, enter additional props that only exist on this component
  children: any[]
}

export default function WideNarrowForm(props: WideNarrowFormProps) {
  const {children} = props;

  return (
    <>
    {children && children.length === 2 &&
      <div className="psdk-wide-narrow-column">
        <div className="psdk-wide-column-column">
          {children[0]}
        </div>
        <div className="psdk-narrow-column-column">
          {children[1]}
        </div>
      </div>
    }
    </>

  )

}
