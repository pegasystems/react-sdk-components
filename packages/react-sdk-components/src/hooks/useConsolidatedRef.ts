import { useRef, useState, type Ref, type MutableRefObject, type RefObject } from 'react';

/**
 * @example const ref = useConsolidatedRefs(refs);
 * @param refs The ref or refs to consolidate.
 * @returns ref:: The consolidated ref.
 */
const useConsolidatedRef = <T>(...refs: (Ref<T> | undefined)[]): RefObject<T> => {
  const targetRef: MutableRefObject<T | null> = useRef<T>(null);

  const [refProxy] = useState(() =>
    Object.defineProperty({ current: null }, 'current', {
      configurable: true,
      enumerable: true,
      get: () => targetRef.current,
      set: (value) => {
        targetRef.current = value;
        refs.forEach((ref) => {
          if (!ref) return;

          if (typeof ref === 'function') {
            ref(targetRef.current);
          } else {
            (ref as MutableRefObject<T | null>).current = targetRef.current;
          }
        });
      },
    }),
  );

  return refProxy;
};

export default useConsolidatedRef;
