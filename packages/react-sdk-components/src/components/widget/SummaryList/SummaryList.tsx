import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';

// SummaryList does NOT have getPConnect. So, no need to extend from PConnProps

interface SummaryListProps {
  // If any, enter additional props that only exist on this component
  arItems$: any[];
  menuIconOverride$?: string;
  menuIconOverrideAction$?: any;
}

export default function SummaryList(props: SummaryListProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const SummaryItem = getComponentFromMap('SummaryItem');

  const { menuIconOverride$: menuOverride = '' } = props;
  return (
    <div>
      {props.arItems$.map(file => (
        <SummaryItem key={file.id} menuIconOverride$={menuOverride} arItems$={file} menuIconOverrideAction$={props.menuIconOverrideAction$} />
      ))}
    </div>
  );
}
