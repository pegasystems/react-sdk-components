import React, { Children } from "react";
import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';

// WideNarrowPage does NOT have getPConnect. So, no need to extend from PConnProps
interface WideNarrowPageProps {
  // If any, enter additional props that only exist on this component
  children: Array<any>,
  title: string,
  templateCol?: string,
  icon?: string
}


/*
 * The wrapper handles knowing how to take in just children and mapping
 * to the Cosmos template.
 */
export default function WideNarrowPage(props: WideNarrowPageProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const WideNarrow = getComponentFromMap('WideNarrow');

  const { children, title, templateCol = '1fr 1fr', icon = '' } = props;
  const childArray = Children.toArray(children);

  return (
    <div>
    <WideNarrow
        a={childArray[0]}
        b={childArray[1]}
        title={title}
        cols={templateCol}
        icon={icon?.replace("pi pi-", "")}
      />
    </div>
  );
}
