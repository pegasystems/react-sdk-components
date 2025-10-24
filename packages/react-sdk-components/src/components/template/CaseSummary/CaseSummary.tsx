import type { PropsWithChildren } from 'react';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';

interface CaseSummaryProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  arPrimaryFields: any[];
  arSecondaryFields: any[];
}

export default function CaseSummary(props: PropsWithChildren<CaseSummaryProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const CaseSummaryFields = getComponentFromMap('CaseSummaryFields');

  const { arPrimaryFields, arSecondaryFields } = props;

  return (
    <div id='CaseSummary'>
      <CaseSummaryFields theFields={arPrimaryFields} />
      <CaseSummaryFields theFields={arSecondaryFields} />
    </div>
  );
}
