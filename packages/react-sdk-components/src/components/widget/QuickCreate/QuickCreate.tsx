import { Utils } from '../../helpers/utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
// import type { PConnProps } from '../../../types/PConnProps';

// Can't add PConnTypes until we can resolve type problems with
//  2nd arg to createWork
// interface QuickCreateProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
// }


export default function QuickCreate(props /* : QuickCreateProps */) {
  // Get emitted components from map (so we can get any override that may exist)
  const WssQuickCreate = getComponentFromMap('WssQuickCreate');

  const { getPConnect, heading, showCaseIcons, classFilter } = props;
  const pConn = getPConnect();
  const createCase = (className) => {
    pConn
      .getActionsApi()
      .createWork(className, { })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.log('Error in case creation: ', error?.message)
      });
  };

  const cases: any = [];
  const envInfo = PCore.getEnvironmentInfo();
  if (
    classFilter &&
    envInfo.environmentInfoObject &&
    envInfo.environmentInfoObject.pyCaseTypeList &&
    envInfo.environmentInfoObject.pyCaseTypeList.length > 0
  ) {
    classFilter.forEach((item) => {
      let icon = Utils.getImageSrc('polaris-solid', Utils.getSDKStaticConentUrl());
      let label = '';
      envInfo.environmentInfoObject.pyCaseTypeList.forEach((casetype) => {
        if (casetype.pyWorkTypeImplementationClassName === item) {
          icon = casetype.pxIcon && Utils.getImageSrc(casetype?.pxIcon, Utils.getSDKStaticConentUrl());
          label = casetype.pyWorkTypeName ?? '';
        }
      });
      if (label !== '') {
        cases.push({
          label,
          onClick: () => {
            createCase(item);
          },
          ...(showCaseIcons && { icon })
        });
      }
    });
  }

  return (
      <div>
        <WssQuickCreate heading={heading} actions={cases} />
      </div>
    );
}
