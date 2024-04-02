import { ReactElement, useMemo } from 'react';
import { Grid } from '@material-ui/core';
import FieldGroup from '../../designSystemExtension/FieldGroup';
import { PConnFieldProps } from '../../../types/PConnProps';

interface GroupProps extends PConnFieldProps {
  children: ReactElement[];
  heading: string;
  showHeading: boolean;
  instructions?: string;
  collapsible: boolean;
  type: string;
}

export default function Group(props: GroupProps) {
  const { children, heading, showHeading, instructions, collapsible, displayMode, type } = props;

  const isReadOnly = displayMode === 'LABELS_LEFT';

  const content = useMemo(() => {
    return (
      <Grid container spacing={2}>
        {children?.map(child => (
          <Grid item xs={12} key={child.key}>
            {child}
          </Grid>
        ))}
      </Grid>
    );
  }, [children, type, isReadOnly]);

  if (!children) return null;

  return (
    <FieldGroup name={showHeading ? heading : undefined} collapsible={collapsible} instructions={instructions}>
      {content}
    </FieldGroup>
  );
}
