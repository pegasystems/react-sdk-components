import { PropsWithChildren, ReactElement } from 'react';
import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';

// NarrowWidePage does NOT have getPConnect. So, no need to extend from PConnProps
interface NarrowWidePageProps {
  // If any, enter additional props that only exist on this component
  title: string;
  templateCol: string;
  icon: string;
}

/*
 * The wrapper handles knowing how to take in just children and mapping
 * to the Cosmos template.
 */
export default function NarrowWidePage(props: PropsWithChildren<NarrowWidePageProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const NarrowWide = getComponentFromMap('NarrowWide');

  const { children, title, templateCol = '1fr 1fr', icon = '' } = props;
  const childrenToRender = children as ReactElement[];

  return (
    <div>
      <NarrowWide a={childrenToRender[0]} b={childrenToRender[1]} title={title} cols={templateCol} icon={icon?.replace('pi pi-', '')} />
    </div>
  );
}
