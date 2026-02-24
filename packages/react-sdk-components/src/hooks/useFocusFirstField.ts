import { useEffect, useRef } from 'react';

/**
 * @example useFocusFirstField(id, children);
 * Focuses first editable field in the view based on field identity.
 */
const useFocusFirstField = (id, children) => {
  // Track the unique identity (id or name) of the first field we focused
  const prevFirstFieldId = useRef(null);

  useEffect(() => {
    const assignment = document.getElementById(id);

    if (assignment) {
      const editableElements = assignment.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');

      if (editableElements.length > 0) {
        const firstElement: any = editableElements[0];

        const currentIdentifier = firstElement.id || firstElement.name || firstElement;

        // If the first field's identity has changed, it means we navigated to a new view
        if (prevFirstFieldId.current !== currentIdentifier) {
          // Use setTimeout to defer focus slightly.
          // This ensures that after a "Submit" click, React has fully committed the
          // new DOM and the browser's native click events have finished resolving.
          setTimeout(() => {
            firstElement.focus();
          }, 0);

          // Update the ref. Now, if the user adds/edits a record in this view,
          // the identifier will match, and the hook will safely do nothing.
          prevFirstFieldId.current = currentIdentifier;
        }
      } else {
        // If the new view is read-only (no inputs found), reset the tracker
        prevFirstFieldId.current = null;
      }
    }
  }, [id, children]);
};

export default useFocusFirstField;
