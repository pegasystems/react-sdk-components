import React from "react";
import OneColumn from '../OneColumn/OneColumn';

// OneColumnPage does NOT have getPConnect. So, no need to extend from PConnProps
interface OneColumnPageProps{
  // If any, enter additional props that only exist on this component
  children: Array<any>
}


/*
 * The wrapper handles knowing how to take in just children
 *  and mapping to the TwoColumn template.
 */
export default function OneColumnPage(props: OneColumnPageProps) {

  return (
    <OneColumn
       {...props}
    />
  );
}
