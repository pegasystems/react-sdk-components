import React from "react";
// import type { PConnProps } from '../../../types/PConnProps';

// Can't use PConn props until proper props for createComponent in typedefs
// interface MultiReferenceReadOnlyProps extends PConnProps {
//   config: { referenceList: any, readonlyContextList: any },
//   label: string,
//   hideLabel: boolean
// }


export default function MultiReferenceReadOnly(props /*: MultiReferenceReadOnlyProps */) {
  const { getPConnect, label = '', hideLabel = false, config } = props;
  const { referenceList, readonlyContextList } = config;

  // When referenceList does not contain selected values, it should be replaced with readonlyContextList while calling SimpleTableManual
  let readonlyContextObject;
  if ( !PCore.getAnnotationUtils().isProperty(referenceList)) {
    readonlyContextObject = {
      referenceList: readonlyContextList
    };
  }

  const component =  getPConnect().createComponent({
    type: "SimpleTable",
    config: {
      ...config,
      ...readonlyContextObject,
      label,
      hideLabel
    }
  });

   return (
    <React.Fragment>{component}</React.Fragment>
  )
}
