// BaseProps.d.ts
// This gives us a place to have each component extend its props (from BaseProps)
//  such that every component will be expected to have a getPConnect() function
//  that returns a PConnect object. (new/better way of doing .propTypes).
//  This BaseProps can be extended to include other props that we know are in every component
export interface BaseProps {
  // getPConnect should exist for every C11n component. (add @ts-ignore in special cases where it isn't)
  getPConnect: () => typeof PConnect;

  // Allow any/all other key/vlaue pairs in the BaseProps for now
  //  TODO: refine which other props are always expected for various component
  //    types and consider further interface "subclassing". For example, we may
  //    want to create a "BasePropsForm" that gives guidance on required, readonly, etc.
  //    and any other props that every Form component expects.
  [key: string]: any;
}
