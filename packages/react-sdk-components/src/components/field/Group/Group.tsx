import { type ReactElement, useMemo } from 'react';
import Grid2 from '@mui/material/Grid2';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import useCollapsibleState from '../../../hooks/useCollapsibleState';
import type { PConnFieldProps } from '../../../types/PConnProps';

interface GroupProps extends PConnFieldProps {
  children: ReactElement[];
  heading: string;
  showHeading: boolean;
  instructions?: string;
  collapseOnLoad?: any;
  type: string;
  defaultCollapsed?: any;
  collapsible?: any;
}

export default function Group(props: GroupProps) {
  const FieldGroup = getComponentFromMap('FieldGroup');
  const { children, displayMode, type, defaultCollapsed, showHeading, collapsible, collapseOnLoad, heading } = props;
  const { isCollapsibleMode, collapsed, setCollapsed } = useCollapsibleState(collapseOnLoad, collapsible, defaultCollapsed, showHeading);
  const isReadOnly = displayMode === 'DISPLAY_ONLY';

  const onToggleCollapsed = () => {
    setCollapsed(current => !current);
  };

  const content = useMemo(() => {
    return (
      <Grid2 container spacing={2}>
        {children?.map(child => (
          <Grid2 size={{ xs: 12 }} key={child.key}>
            {child}
          </Grid2>
        ))}
      </Grid2>
    );
  }, [children, type, isReadOnly]);

  if (!children) return null;

  return (
    <FieldGroup
      isCollapsibleMode={isCollapsibleMode}
      collapsed={collapsed}
      onToggleCollapsed={onToggleCollapsed}
      showHeading={showHeading}
      heading={heading}
    >
      {content}
    </FieldGroup>
  );
}
