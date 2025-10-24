import type { ReactNode } from 'react';
import { isValidElement } from 'react';

export function prepareCaseSummaryData(caseSummaryRegion, portalSpecificVisibilityChecker?) {
  const filterVisibleChildren = children => {
    return children
      ?.getPConnect()
      ?.getChildren()
      ?.filter(child => {
        const configProps = child.getPConnect().getConfigProps();
        const defaultVisibilityCn = !('visibility' in configProps) || configProps.visibility === true;
        return defaultVisibilityCn && (portalSpecificVisibilityChecker?.(configProps) ?? true);
      });
  };
  const convertChildrenToSummaryData = children => {
    return children?.map(childItem => {
      const childPConnData = childItem.getPConnect().resolveConfigProps(childItem.getPConnect().getRawMetadata());
      return childPConnData;
    });
  };

  const summaryFieldChildren = caseSummaryRegion.props
    .getPConnect()
    .getChildren()[0]
    ?.getPConnect()
    ?.getReferencedViewPConnect()
    ?.getPConnect()
    ?.getChildren();

  const primarySummaryFields =
    summaryFieldChildren && summaryFieldChildren.length > 0
      ? convertChildrenToSummaryData(filterVisibleChildren(summaryFieldChildren[0]))
      : undefined;
  const secondarySummaryFields =
    summaryFieldChildren && summaryFieldChildren.length > 1
      ? convertChildrenToSummaryData(filterVisibleChildren(summaryFieldChildren[1]))
      : undefined;

  return {
    primarySummaryFields,
    secondarySummaryFields
  };
}

export const filterUtilities = (utils: ReactNode) => {
  let utilsMeta;
  if (isValidElement(utils)) {
    const pConnect = utils.props.getPConnect();
    utilsMeta = pConnect.getRawMetadata?.();
    if (!utilsMeta?.children?.length) return;
    utilsMeta = {
      ...utilsMeta,
      children: utilsMeta.children.filter((child: any) => child.config?.availableInChannel?.selfService === true)
    };
    return utilsMeta.children?.length ? pConnect.createComponent(utilsMeta) : undefined;
  }
  return utilsMeta;
};
