import { createElement, ReactElement } from 'react';

import createPConnectComponent from '../../bridge/react_pconnect';

/**
 *
 * @param {*} pConn - pConnect object of the view
 * @returns {string} - returns the name of referenceList
 */

export const getReferenceList = pConn => {
  let resolvePage = pConn.getComponentConfig().referenceList.replace('@P ', '');
  if (resolvePage.includes('D_')) {
    resolvePage = pConn.resolveDatasourceReference(resolvePage);
    if (resolvePage?.pxResults) {
      resolvePage = resolvePage?.pxResults;
    } else if (resolvePage.startsWith('D_') && !resolvePage.endsWith('.pxResults')) {
      resolvePage = `${resolvePage}.pxResults`;
    }
  }
  return resolvePage;
};

/**
 * creates and returns react element of the view
 * @param {*} pConn - pConnect object of the view
 * @param {*} index - index of the fieldGroup item
 * @param {*} viewConfigPath - boolean value to check for children in config
 * @returns {*} - return the react element of the view
 */
export function buildView(pConn, index, viewConfigPath): ReactElement {
  const context = pConn.getContextName();
  const referenceList = getReferenceList(pConn);

  const isDatapage = referenceList.startsWith('D_');
  const pageReference = isDatapage ? `${referenceList}[${index}]` : `${pConn.getPageReference()}${referenceList}[${index}]`;
  const meta = viewConfigPath ? pConn.getRawMetadata().children[0].children[0] : pConn.getRawMetadata().children[0];

  delete meta?.config?.ruleClass;

  const config = {
    meta,
    options: {
      context,
      pageReference,
      referenceList,
      hasForm: true
    }
  };

  const view = PCore.createPConnect(config);
  if (pConn.getConfigProps()?.displayMode === 'DISPLAY_ONLY') {
    view.getPConnect()?.setInheritedProp('displayMode', 'DISPLAY_ONLY');
  }
  return createElement(createPConnectComponent(), view);
}
