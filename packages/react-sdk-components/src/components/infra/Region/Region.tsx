import React from "react";

// Region does NOT have getPConnect. So, no need to extend from PConnProps
interface RegionProps {
  // If any, enter additional props that only exist on this component
  children: Array<any>
}


export default function Region(props: RegionProps) {
  const { children } = props;

  return <React.Fragment>
    <>
      {/* <div>Region</div> */}
      {children}
    </>
  </React.Fragment>;
}
