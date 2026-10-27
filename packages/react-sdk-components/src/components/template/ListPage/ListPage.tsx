import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { usePageGenAICoach, withPageUtilities } from '../utils';
import type { GenAICoach } from '../../widget/GenAICoach/GenAICoach.types';
import type { PConnProps } from '../../../types/PConnProps';

interface ListPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  parameters: object;
  // Agents configured on the page
  coaches?: GenAICoach[];
  localeReference?: string;
}

export default function ListPage(props: ListPageProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const ListView = getComponentFromMap('ListView');

  const { getPConnect, coaches, localeReference } = props;
  const genAICoachProps = usePageGenAICoach(getPConnect, coaches, localeReference);

  // special case for ListView - add in a prop
  const listViewProps = { ...props, bInForm: false };
  return withPageUtilities(<ListView {...listViewProps} />, genAICoachProps);
}
