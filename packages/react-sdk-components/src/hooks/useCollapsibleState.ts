import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Controls the initial collapse behaviour of the field group:
 * - `'none'` — not collapsible (default)
 * - `'expanded'` — collapsible, starts expanded
 * - `'collapsed'` — collapsible, starts collapsed
 * - `true` / `false` — legacy aliases for `'expanded'` / `'none'`, kept for backward
 *   compatibility with existing authored views that still emit the old boolean `collapsible` prop.
 */
type CollapseOnLoad = 'none' | 'expanded' | 'collapsed' | boolean;

interface CollapsibleState {
  isCollapsibleMode: boolean;
  collapsed: boolean | undefined;
  setCollapsed: Dispatch<SetStateAction<boolean | undefined>>;
}

const useCollapsibleState = (
  collapseOnLoad: CollapseOnLoad,
  collapsible: boolean | undefined,
  defaultCollapsed: boolean,
  showHeading: boolean
): CollapsibleState => {
  // Backward compat: legacy `collapsible: true` maps to new collapseOnLoad values,
  // but only when collapseOnLoad is still the default ('none') so the new value always wins.
  let effectiveCollapseOnLoad: CollapseOnLoad = collapseOnLoad;
  if (collapseOnLoad === 'none' && collapsible === true) {
    effectiveCollapseOnLoad = defaultCollapsed ? 'collapsed' : 'expanded';
  }

  const isCollapsibleMode = effectiveCollapseOnLoad === true || effectiveCollapseOnLoad === 'expanded' || effectiveCollapseOnLoad === 'collapsed';

  const isCollapsedByDefault = effectiveCollapseOnLoad === true || effectiveCollapseOnLoad === 'collapsed';

  const [collapsed, setCollapsed] = useState<boolean | undefined>(isCollapsibleMode && showHeading ? isCollapsedByDefault : undefined);

  return { isCollapsibleMode, collapsed, setCollapsed };
};

export default useCollapsibleState;
