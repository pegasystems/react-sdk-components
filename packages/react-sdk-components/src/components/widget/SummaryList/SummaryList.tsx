import LazyLoad from '../../../bridge/LazyLoad';
import { PConnProps } from '../../../types/PConnProps';

interface SummaryListProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  arItems$: any[];
  menuIconOverride$?: string;
  menuIconOverrideAction$?: any;
}

export default function SummaryList(props: SummaryListProps) {
  const { menuIconOverride$: menuOverride = '' } = props;
  return (
    <div>
      {props.arItems$.map(file => (
        <LazyLoad
          componentName='SummaryItem'
          key={file.id}
          menuIconOverride$={menuOverride}
          arItems$={file}
          menuIconOverrideAction$={props.menuIconOverrideAction$}
        />
      ))}
    </div>
  );
}
