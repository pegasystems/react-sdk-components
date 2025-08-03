import { PropsWithChildren, ReactElement } from 'react';
import LazyLoad from '../../../../bridge/LazyLoad';
import { PConnProps } from '../../../../types/PConnProps';

interface NarrowWidePageProps extends PConnProps {
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
  const { children, title, templateCol = '1fr 1fr', icon = '' } = props;
  const childrenToRender = children as ReactElement[];

  return (
    <div>
      <LazyLoad
        componentName='NarrowWide'
        a={childrenToRender[0]}
        b={childrenToRender[1]}
        title={title}
        cols={templateCol}
        icon={icon?.replace('pi pi-', '')}
      />
    </div>
  );
}
