import LazyLoad from '../../../bridge/LazyLoad';
import { PConnProps } from '../../../types/PConnProps';

interface ListPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  parameters: object;
}

export default function ListPage(props: ListPageProps) {
  // special case for ListView - add in a prop
  const listViewProps = { ...props, bInForm: false };
  return <LazyLoad componentName='ListView' {...listViewProps} />;
}
