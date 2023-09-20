import React from "react";

import TwoColumn from '../TwoColumn/TwoColumn';

// TwoColumnPage does NOT have getPConnect. So, no need to extend from PConnProps
interface TwoColumnPageProps{
  // If any, enter additional props that only exist on this component
  children: Array<any>
}


/*
 * The wrapper handles knowing how to take in just children
 *  and mapping to the TwoColumn template.
 */
export default function TwoColumnPage(props: TwoColumnPageProps) {

  return (
    <TwoColumn
      {...props}
    />
  );
}
