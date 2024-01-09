import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';

// TwoColumnPage does NOT have getPConnect. So, no need to extend from PConnProps
interface TwoColumnPageProps{
  // If any, enter additional props that only exist on this component
  children: Array<any>
}


/*
 * The wrapper handles knowing how to take in just children
 *  and mapping to the TwoColumn template.
 */
export default function TwoColumnPage(props: TwoColumnPageProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const TwoColumn = getComponentFromMap('TwoColumn');

  return (
    <TwoColumn
      {...props}
    />
  );
}
