import LazyLoad from '../../../../bridge/LazyLoad';
import { PConnProps } from '../../../../types/PConnProps';

interface OneColumnPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
}

/*
 * The wrapper handles knowing how to take in just children
 *  and mapping to the TwoColumn template.
 */
export default function OneColumnPage(props: OneColumnPageProps) {
  return <LazyLoad componentName='OneColumn' {...props} />;
}
