import type { PConnProps } from '../../../types/PConnProps';

interface MultiReferenceReadOnlyProps extends PConnProps {
  config: { referenceList: any, readonlyContextList: any },
  label: string,
  hideLabel: boolean
}


export default function MultiReferenceReadOnly(props: MultiReferenceReadOnlyProps) {
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
  },
  '', '', {}); // 2nd, 3rd, and 4th args empty string/object/null until typedef marked correctly as optional

   return (
    <>{component}</>
  )
}
