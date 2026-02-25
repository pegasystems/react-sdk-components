import { useLayoutEffect, useRef } from 'react';

/**
 * @example useFocusFirstField(id, viewName);
 * Focuses first editable field in the view based on field identity.
 */
const useFocusFirstField = (id, viewName) => {
  const previousViewNameRef = useRef(null);

  useLayoutEffect(() => {
    if (previousViewNameRef.current === viewName || !viewName) {
      return;
    }

    previousViewNameRef.current = viewName;
    const assignment = document.getElementById(id);

    if (assignment) {
      setTimeout(() => {
        // Find all editable elements within the div
        const editableElements: NodeListOf<HTMLElement> = assignment.querySelectorAll('input, select, textarea, div[role="combobox"]');
        if (editableElements.length > 0) {
          // Focus on the first editable element
          editableElements[0].focus();
        }
      }, 100);
    }
  }, [viewName]);
};

export default useFocusFirstField;
