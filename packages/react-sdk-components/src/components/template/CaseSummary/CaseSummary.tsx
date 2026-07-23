import type { PropsWithChildren, ReactElement } from 'react';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import type { PConnProps } from '../../../types/PConnProps';

interface CaseSummaryProps extends PConnProps {
  arPrimaryFields: any[];
  arSecondaryFields: any[];
  // If any, enter additional props that only exist on this component
}

export default function CaseSummary(props: PropsWithChildren<CaseSummaryProps>) {
  // Get emitted components from map (so we can get any override that may exist)
  const CaseSummaryFields = getComponentFromMap('CaseSummaryFields');

  const { children } = props;
  let { arPrimaryFields = [], arSecondaryFields = [] } = props;

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'ModalContainer';

  if (arPrimaryFields.length === 0 && arSecondaryFields.length === 0) {
    for (const child of children as ReactElement[]) {
      const childPConn = (child as ReactElement<any>).props.getPConnect();
      const childPConnData = childPConn.resolveConfigProps(childPConn.getRawMetadata());
      if (childPConnData.name.toLowerCase() === 'primary fields') {
        arPrimaryFields = childPConnData.children;
        arPrimaryFields.forEach(field => {
          if (field.config?.value && typeof field.config?.value === 'string') {
            field.config.value = localizedVal(field.config.value, localeCategory);
          }
        });
      } else if (childPConnData.name.toLowerCase() === 'secondary fields') {
        const secondaryChildren = childPConn.getChildren();
        arSecondaryFields = childPConnData.children;
        arSecondaryFields.forEach((field, index) => {
          const childItemPConnect = secondaryChildren[index]?.getPConnect();
          const resolvedProps = childItemPConnect?.resolveConfigProps(childItemPConnect.getRawMetadata()?.config);
          field.config.displayLabel = resolvedProps?.label || field.config.label;
          field.getPConnect = secondaryChildren[index]?.getPConnect;
        });
      }
    }
  }

  return (
    <div id='CaseSummary'>
      <CaseSummaryFields theFields={arPrimaryFields} variant='primary' />
      <CaseSummaryFields theFields={arSecondaryFields} variant='secondary' />
    </div>
  );
}
