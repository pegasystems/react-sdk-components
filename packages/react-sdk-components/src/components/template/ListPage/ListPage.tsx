import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';

interface ListPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  parameters: object
}


export default function ListPage(props: ListPageProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const ListView = getComponentFromMap('ListView');

 // special case for ListView - add in a prop
 const listViewProps = {...props, bInForm: false};
  return (
    <ListView  {...listViewProps} />
  )
}
