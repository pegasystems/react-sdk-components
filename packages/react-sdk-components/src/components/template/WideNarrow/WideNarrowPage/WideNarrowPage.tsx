import { Children, type PropsWithChildren } from 'react';
import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import { usePageGenAICoach, withPageUtilities } from '../../utils';
import type { GenAICoach } from '../../../widget/GenAICoach/GenAICoach.types';
import type { PConnProps } from '../../../../types/PConnProps';

interface WideNarrowPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  title: string;
  templateCol?: string;
  icon?: string;
  // Agents configured on the page
  coaches?: GenAICoach[];
  localeReference?: string;
}

/*
 * The wrapper handles knowing how to take in just children and mapping
 * to the Cosmos template.
 */
export default function WideNarrowPage(props: PropsWithChildren<WideNarrowPageProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const WideNarrow = getComponentFromMap('WideNarrow');

  const { children, getPConnect, title, templateCol = '1fr 1fr', icon = '', coaches, localeReference } = props;
  const childArray = Children.toArray(children);

  const genAICoachProps = usePageGenAICoach(getPConnect, coaches, localeReference);

  return withPageUtilities(
    <div>
      <WideNarrow a={childArray[0]} b={childArray[1]} title={title} cols={templateCol} icon={icon?.replace('pi pi-', '')} />
    </div>,
    genAICoachProps
  );
}
