import type { PropsWithChildren, ReactElement } from 'react';
import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import { usePageGenAICoach, withPageUtilities } from '../../utils';
import type { GenAICoach } from '../../../widget/GenAICoach/GenAICoach.types';
import type { PConnProps } from '../../../../types/PConnProps';

interface NarrowWidePageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  title: string;
  templateCol: string;
  icon: string;
  // Agents configured on the page
  coaches?: GenAICoach[];
  localeReference?: string;
}

/*
 * The wrapper handles knowing how to take in just children and mapping
 * to the Cosmos template.
 */
export default function NarrowWidePage(props: PropsWithChildren<NarrowWidePageProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const NarrowWide = getComponentFromMap('NarrowWide');

  const { children, getPConnect, title, templateCol = '1fr 1fr', icon = '', coaches, localeReference } = props;
  const childrenToRender = children as ReactElement[];

  const genAICoachProps = usePageGenAICoach(getPConnect, coaches, localeReference);

  return withPageUtilities(
    <div>
      <NarrowWide a={childrenToRender[0]} b={childrenToRender[1]} title={title} cols={templateCol} icon={icon?.replace('pi pi-', '')} />
    </div>,
    genAICoachProps
  );
}
