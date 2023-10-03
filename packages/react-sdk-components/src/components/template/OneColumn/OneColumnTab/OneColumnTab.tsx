import React from "react";

interface OneColumnTabProps{
  // If any, enter additional props that only exist on this component
  children: Array<any>
}
export default function OneColumnTab(props: OneColumnTabProps) {
  const { children} = props;

  return (
    <div id="OneColumnTab">
      {children}
    </div>
  )
}
