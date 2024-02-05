import { PropsWithChildren } from 'react';

interface OneColumnTabProps {
  // If any, enter additional props that only exist on this component
}
export default function OneColumnTab(props: PropsWithChildren<OneColumnTabProps>) {
  const { children } = props;

  return <div id='OneColumnTab'>{children}</div>;
}
