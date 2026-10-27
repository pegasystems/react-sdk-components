import type { ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';
import { Box } from '@mui/material';

import { getComponentFromMap } from '../../bridge/helpers/sdk_component_map';
import useGenAICoachObj from '../../hooks/useGenAICoachObj';
import type { GenAICoach } from '../widget/GenAICoach/GenAICoach.types';
import type { UtilitiesLayoutProps } from '../designSystemExtension/GenAICoachContent/GenAICoach.types';

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
    const pConnect = (utils as ReactElement<any>).props.getPConnect();
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

/**
 * Agent props for the agents configured on a landing page. As in the Constellation page templates, the page's locale
 * reference is the conversation context and the conversations are cached as the landing page's. Infinity runtime only
 * (isInfinityRuntime() is not in the 4.1 typings).
 */
export const usePageGenAICoach = (getPConnect: () => typeof PConnect, coaches: GenAICoach[] = [], localeReference = '') => {
  const isInfinityRuntime = !!(PCore.getEnvironmentInfo() as any).isInfinityRuntime?.();
  return useGenAICoachObj(isInfinityRuntime && coaches.length ? coaches : undefined, localeReference, getPConnect(), false, false, true);
};

/**
 * Renders a landing page with its utilities column at the end, as the Cosmos page templates do with their
 * `utilities` slot; below the md breakpoint the column follows the page. A page without agents is returned unchanged.
 */
export const withPageUtilities = (page: ReactNode, genAICoachProps?: UtilitiesLayoutProps['genAICoachProps']) => {
  if (!genAICoachProps) return page;

  const UtilitiesLayout = getComponentFromMap('UtilitiesLayout');
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-start' } }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>{page}</Box>
      <UtilitiesLayout genAICoachProps={genAICoachProps} />
    </Box>
  );
};
