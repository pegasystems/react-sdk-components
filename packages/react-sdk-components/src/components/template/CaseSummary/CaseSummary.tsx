import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';

interface CaseSummaryProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  children: any[]
}


export default function CaseSummary(props: CaseSummaryProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const CaseSummaryFields = getComponentFromMap('CaseSummaryFields');

  const { getPConnect, children } = props;
  const thePConn = getPConnect();
  const theConfigProps:any = thePConn.getConfigProps();
  // const { status, showStatus } = theConfigProps;
  const status = theConfigProps.status;
  const showStatus = theConfigProps.showStatus;

  // from Constellation DX Components
  // get the primary and secondary fields with the raw data (which has the non-resolved property values)
  // const regionsRaw = getPConnect().getRawMetadata().children;
  // const primaryFieldsRaw = regionsRaw[0].children;
  // const secondaryFieldsRaw = regionsRaw[1].children;

  // From other SDKs
  // may want to move these into useEffect/useState combo
  let arPrimaryFields:any[] = [];
  let arSecondaryFields:any[] = [];

  for (const child of children) {
    const childPConn = child.props.getPConnect();
    const childPConnData = childPConn.resolveConfigProps(childPConn.getRawMetadata());
    if (childPConnData.name.toLowerCase() === "primary fields") {
      arPrimaryFields = childPConnData.children;
    } else if (childPConnData.name.toLowerCase() === "secondary fields") {
      arSecondaryFields = childPConnData.children;
    }
  }

  // At this point, should hand off to another component for layout and rendering
  //  of primary and secondary fields in the Case Summary

  // debugging/investigation help
  // console.log(`CaseSummary: arPrimaryFields: ${JSON.stringify(arPrimaryFields)}`);
  // console.log(`CaseSummary: arSecondaryFields: ${JSON.stringify(arSecondaryFields)}`);

  return (
    <div id="CaseSummary">
      <CaseSummaryFields status={status} showStatus={showStatus} theFields={arPrimaryFields} />
      <CaseSummaryFields theFields={arSecondaryFields} />
    </div>
  )
}
