import { createContext } from 'react';
import type { ReactNode } from 'react';

// Provided by AppShell and read by the GenAICoach widget. Like NavContext, it lives in helpers so that an overridden
// AppShell or GenAICoach still shares this one context object with the SDK components.
// Only the members the SDK reads are ported from Constellation: panel resizing and the portal flags are not.
export interface PortalAgentContextValue {
  showAgentPanel: boolean;
  agentExpanded: boolean;
  onAgentToggle: () => void;
  onAgentClick: () => void;
  /**
   * The page-content panel rendered to the right of the agent in the portal
   * split view.  `undefined` when not in portal-agent mode.
   */
  pagePanel?: {
    /** The page-content node rendered in the right panel. */
    content: ReactNode;
    /** Whether the right panel is currently visible. */
    visible: boolean;
  };
}

const defaultContext = {
  showAgentPanel: true,
  agentExpanded: false,
  onAgentToggle: () => {},
  onAgentClick: () => {},
  pagePanel: undefined
} satisfies PortalAgentContextValue;

const PortalAgentContext = createContext<PortalAgentContextValue>(defaultContext);

export default PortalAgentContext;
