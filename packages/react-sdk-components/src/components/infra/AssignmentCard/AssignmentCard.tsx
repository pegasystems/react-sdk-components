import { PropsWithChildren, useEffect, useState } from 'react';

import { PConnProps } from '../../../types/PConnProps';
import LazyLoad from '../../../bridge/LazyLoad';

interface AssignmentCardProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  actionButtons: any;
  onButtonPress: any;
}

export default function AssignmentCard(props: PropsWithChildren<AssignmentCardProps>) {
  const { children, actionButtons, onButtonPress } = props;

  const [arMainButtons, setArMainButtons] = useState([]);
  const [arSecondaryButtons, setArSecondaryButtons] = useState([]);

  useEffect(() => {
    if (actionButtons) {
      setArMainButtons(actionButtons.main);
      setArSecondaryButtons(actionButtons.secondary);
    }
  }, [actionButtons]);

  function buttonPress(sAction, sType) {
    onButtonPress(sAction, sType);
  }

  return (
    <>
      {children}
      {arMainButtons && arSecondaryButtons && (
        <LazyLoad componentName='ActionButtons' arMainButtons={arMainButtons} arSecondaryButtons={arSecondaryButtons} onButtonPress={buttonPress} />
      )}
    </>
  );
}
