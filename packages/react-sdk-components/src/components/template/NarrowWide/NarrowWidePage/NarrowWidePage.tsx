import React, { Children } from "react";
// import { TwoColumnPage as TwoColumn } from "@pega/cosmos-react-core";
import NarrowWide from '../NarrowWide/NarrowWide';


// NarrowWidePage does NOT have getPConnect. So, no need to extend from PConnProps
interface NarrowWidePageProps {
  // If any, enter additional props that only exist on this component
  children: Array<any>,
  title: string,
  templateCol: string,
  icon: string
}


/*
 * The wrapper handles knowing how to take in just children and mapping
 * to the Cosmos template.
 */
export default function NarrowWidePage(props: NarrowWidePageProps) {
  const { children, title, templateCol = '1fr 1fr', icon = '' } = props;
  const childArray = Children.toArray(children);

  return (
    <div>
    <NarrowWide
        a={childArray[0]}
        b={childArray[1]}
        title={title}
        cols={templateCol}
        icon={icon?.replace("pi pi-", "")}
      />
    </div>
  );
}
