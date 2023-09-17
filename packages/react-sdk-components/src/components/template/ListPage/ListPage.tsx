import React from "react";

import ListView from '../ListView';

import type { PConnProps } from '../../../types/PConnProps';

interface ListPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  parameters: object
}


export default function ListPage(props: ListPageProps) {

  return (
    <ListView  {...props}></ListView>
  )
}
