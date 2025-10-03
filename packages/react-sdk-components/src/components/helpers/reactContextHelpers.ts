import { createContext, useContext } from 'react';

// This file contains a shared access point for any React contexts that may need to be
//  defined/used across various components.

//  For example, the AppShell wants to use a NavContext that interacts with
//  that context's consumption in the NavBar to handle clicks for opening/closing
//  aspects of the NavBar
export const NavContext = createContext({ open: false, setOpen: (f) => f });
export const useNavBar = () => useContext(NavContext);
