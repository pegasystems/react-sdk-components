import { createContext, useContext } from "react";

declare const process:any;

// Argument was null but that failed TypeScript compilation. Change to no arg

const ReactReduxContext = createContext({});

if (process.env.NODE_ENV !== "production") {
  ReactReduxContext.displayName = "ReactRedux";
}

export const useConstellationContext = () => useContext(ReactReduxContext);
export default ReactReduxContext;
