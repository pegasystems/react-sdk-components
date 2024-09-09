import { useEffect } from 'react';

/**
 * @example useFocusFirstField(id, children);
 * Focuses first editable field in the view.
 */
const useFocusFirstField = (id, children) => {
  useEffect(() => {
    const assignment = document.getElementById(id);
    if (assignment) {
      // Find all editable elements within the div
      const editableElements: NodeListOf<HTMLElement> = assignment.querySelectorAll('input, select, textarea');

      // Focus on the first editable element
      if (editableElements.length > 0) {
        editableElements[0].focus();
      }
    }
  }, [children]);
};

export default useFocusFirstField;
