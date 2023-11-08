import { createContext } from 'react';

interface IlayoutContext {
  contentFormat?: string;
}

const LayoutContext = createContext<IlayoutContext>({ contentFormat: undefined });
export default LayoutContext;
