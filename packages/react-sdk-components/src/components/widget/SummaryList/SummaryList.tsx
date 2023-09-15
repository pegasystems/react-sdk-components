import React from "react";
import SummaryItem from '../SummaryItem/index'

// SummaryList does NOT have getPConnect. So, no need to extend from PConnProps

interface SummaryListProps {
  // If any, enter additional props that only exist on this component
  arItems$: Array<any>,
  menuIconOverride$?: string,
  menuIconOverrideAction$?: any
}


export default function SummaryList(props: SummaryListProps) {
  const { menuIconOverride$: menuOverride = ""} = props;
  return (
    <div>
      {props.arItems$.map(file => (
        <SummaryItem key={file.id} menuIconOverride$={menuOverride} arItems$={file} menuIconOverrideAction$={props.menuIconOverrideAction$}></SummaryItem>
      ))}
    </div>
  );
}
