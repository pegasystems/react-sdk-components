import { Children, PropsWithChildren } from 'react';
import LazyLoad from '../../../../bridge/LazyLoad';
import { PConnProps } from '../../../../types/PConnProps';

interface WideNarrowPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  title: string;
  templateCol?: string;
  icon?: string;
}

/*
 * The wrapper handles knowing how to take in just children and mapping
 * to the Cosmos template.
 */
export default function WideNarrowPage(props: PropsWithChildren<WideNarrowPageProps>) {
  // Get emitted components from map (so we can get any override that may exist)

  const { children, title, templateCol = '1fr 1fr', icon = '' } = props;
  const childArray = Children.toArray(children);

  return (
    <div>
      <LazyLoad componentName='WideNarrow' a={childArray[0]} b={childArray[1]} title={title} cols={templateCol} icon={icon?.replace('pi pi-', '')} />
    </div>
  );
}
