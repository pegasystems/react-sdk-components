import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import { usePageGenAICoach, withPageUtilities } from '../../utils';
import type { GenAICoach } from '../../../widget/GenAICoach/GenAICoach.types';
import type { PConnProps } from '../../../../types/PConnProps';

interface TwoColumnPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  // Agents configured on the page
  coaches?: GenAICoach[];
  localeReference?: string;
}

/*
 * The wrapper handles knowing how to take in just children
 *  and mapping to the TwoColumn template.
 */
export default function TwoColumnPage(props: TwoColumnPageProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const TwoColumn = getComponentFromMap('TwoColumn');

  const { getPConnect, coaches, localeReference } = props;
  const genAICoachProps = usePageGenAICoach(getPConnect, coaches, localeReference);

  return withPageUtilities(<TwoColumn {...props} />, genAICoachProps);
}
