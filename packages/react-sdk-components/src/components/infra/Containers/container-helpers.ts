// eslint-disable-next-line import/prefer-default-export
export const isContainerInitialized = (pConnect) => {
  const context = pConnect.getContextName();
  const containerName = pConnect.getContainerName();
  return PCore.getContainerUtils().isContainerInitialized(context, containerName);
};

export const configureBrowserBookmark = (pConnect) => {
  const context = pConnect.getContextName();
  const containerName = pConnect.getContainerName();
  const envInfo = PCore.getEnvironmentInfo();
  const { APP } = PCore.getConstants();

  const navPages = pConnect.getValue('pyPortal.pyPrimaryNavPages');
  let ruleName = '';
  let className = '';
  let defaultViewLabel = '';

  const isNextGenLandingPageRouting = (envInfo?.environmentInfoObject as any)?.pyExecutionRuntimeName === (APP as any).INFINITY_RUNTIME;

  if (Array.isArray(navPages) && navPages.length > 0) {
    const firstNavPage = navPages[0];
    const nestedNavPage = firstNavPage.NavigationPages?.[0];

    if (isNextGenLandingPageRouting) {
      if (nestedNavPage?.pyRuleName) {
        ruleName = nestedNavPage.pyRuleName;
        className = nestedNavPage.pyClassName || '';
      } else if (firstNavPage?.pyRuleName) {
        ruleName = firstNavPage.pyRuleName;
        className = firstNavPage.pyClassName || '';
      } else if (nestedNavPage?.pyLabel) {
        defaultViewLabel = nestedNavPage.pyLabel;
      } else if (firstNavPage?.pyLabel) {
        defaultViewLabel = firstNavPage.pyLabel;
      }
    } else if (nestedNavPage?.pyLabel) {
      defaultViewLabel = nestedNavPage.pyLabel;
    } else if (firstNavPage?.pyLabel) {
      defaultViewLabel = firstNavPage.pyLabel;
    }
  }

  PCore.configureForBrowserBookmark({
    context,
    containerName,
    acName: containerName,
    semanticURL: '',
    defaultViewLabel,
    ruleName,
    className
  });
};
