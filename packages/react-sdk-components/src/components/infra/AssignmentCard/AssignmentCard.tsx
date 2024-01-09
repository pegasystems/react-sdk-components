import { useState, useEffect } from "react";
import type { PConnProps } from '../../../types/PConnProps';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';

interface AssignmentCardProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  children: Array<any>,
  actionButtons: any,
  onButtonPress: any,
  // eslint-disable-next-line react/no-unused-prop-types
  itemKey?: string
}


export default function AssignmentCard(props: AssignmentCardProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const ActionButtons = getComponentFromMap("ActionButtons");

  const { children, actionButtons, onButtonPress} = props;

  const [arMainButtons, setArMainButtons] = useState([]);
  const [arSecondaryButtons, setArSecondaryButtons] = useState([]);

  useEffect( ()=> {
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
      {
        arMainButtons && arSecondaryButtons && <ActionButtons arMainButtons={arMainButtons} arSecondaryButtons={arSecondaryButtons} onButtonPress={buttonPress}></ActionButtons>
      }
    </>
  )
}
