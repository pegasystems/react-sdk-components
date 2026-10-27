import { useEffect, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import type { PortalAgentSplitViewProps } from '../GenAICoachContent/GenAICoach.types';

// Default and minimum width of the agent region beside the page (the Cosmos portal agent defaults).
const portalAgentDefaultWidth = '31.25rem';
const portalAgentMinWidth = '20rem';

// PortalAgentSplitView is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
export default function PortalAgentSplitView(props: PortalAgentSplitViewProps) {
  const { children, pagePanel, showAgentPanel } = props;
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));

  const [agentPanelShown, setAgentPanelShown] = useState(showAgentPanel);

  useEffect(() => {
    if (showAgentPanel) {
      setAgentPanelShown(true);
    }
  }, [showAgentPanel]);

  // The regions are side by side only on wide screens; on narrow screens the agent takes the full width.
  const sideBySide = showAgentPanel && pagePanel.visible && isWide;
  const mainVisible = pagePanel.visible && (!showAgentPanel || sideBySide);

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', minHeight: 0 }}>
      <Box
        aria-hidden={!showAgentPanel}
        inert={!showAgentPanel ? true : undefined}
        sx={{
          display: showAgentPanel ? 'flex' : 'none',
          flexDirection: 'column',
          flexShrink: 0,
          minHeight: 0,
          width: sideBySide ? portalAgentDefaultWidth : '100%',
          minWidth: sideBySide ? portalAgentMinWidth : undefined,
          maxWidth: sideBySide ? '50%' : undefined,
          borderInlineEnd: sideBySide ? `0.0625rem solid ${theme.palette.divider}` : undefined
        }}
      >
        {agentPanelShown && children}
      </Box>

      <Box
        aria-hidden={!mainVisible}
        inert={!mainVisible ? true : undefined}
        sx={{
          display: mainVisible ? 'block' : 'none',
          flexGrow: 1,
          minWidth: 0,
          overflow: 'auto'
        }}
      >
        {pagePanel.content}
      </Box>
    </Box>
  );
}
