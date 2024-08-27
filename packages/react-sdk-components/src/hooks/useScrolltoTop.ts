import { useEffect } from 'react';

/**
 * @example useScrolltoTop(id, children);;
 * Page scrolls to top on view change.
 */
const useScrolltoTop = (id, children) => {
  useEffect(() => {
    const scrollElement = document.querySelector(id);
    scrollElement?.scrollIntoView();
  }, [children]);
};

export default useScrolltoTop;
