import { createContext } from 'react';

const TemplateContext = createContext({
  depth: 0,
  columnCount: 1,
  outerColumnCount: undefined,
  templateOverrideMode: undefined,
  inheritParentLayout: undefined,
  lastContainerItem: undefined
});
export default TemplateContext;
