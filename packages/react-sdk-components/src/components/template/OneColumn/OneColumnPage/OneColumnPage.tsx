import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../../types/PConnProps';

interface OneColumnPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
}

/*
 * The wrapper handles knowing how to take in just children
 *  and mapping to the TwoColumn template.
 */
export default function OneColumnPage(props: OneColumnPageProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const OneColumn = getComponentFromMap('OneColumn');

  return <OneColumn {...props} />;
}
