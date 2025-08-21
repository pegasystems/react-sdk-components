import type { PropsWithChildren } from 'react';
import type { PConnProps } from '../../../../types/PConnProps';

interface OneColumnTabProps extends PConnProps {
  // If any, enter additional props that only exist on this component
}
export default function OneColumnTab(props: PropsWithChildren<OneColumnTabProps>) {
  const { children } = props;

  return <div id='OneColumnTab'>{children}</div>;
}
