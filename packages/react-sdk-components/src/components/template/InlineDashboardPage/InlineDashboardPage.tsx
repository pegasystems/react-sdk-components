import React from 'react';
import { useMemo, Children, useEffect, useState } from 'react';

import { buildFilterComponents } from '../../infra/DashboardFilter/filterUtils';
import InlineDashboard from '../InlineDashboard';
import type { PConnProps } from '../../../types/PConnProps';


interface InlineDashboardPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  children: Array<any>,
  title: string,
  icon?: string,
  filterPosition?: string
}


export default function InlineDashboardPage(props: InlineDashboardPageProps) {
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const { children, getPConnect, icon = '', filterPosition = 'block-start'  } = props;
  const [filterComponents, setFilterComponents] = useState([]);
  const childArray = useMemo(() => {
    return Children.toArray(children);
  }, [children]);

  const allFilters = getPConnect().getRawMetadata()["children"][1];

  useEffect(() => {
    setFilterComponents(buildFilterComponents(getPConnect, allFilters));
  }, []);

  const inlineProps = props;
  // Region layout views
  inlineProps.children[0] = childArray[0];
  // filter items
  inlineProps.children[1] = filterComponents;

  return <InlineDashboard {...inlineProps} />;
}
