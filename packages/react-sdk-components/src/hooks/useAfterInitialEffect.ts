import { useEffect, useRef, EffectCallback, DependencyList } from 'react';

/**
 * @example useAfterInitialEffect(cb, dependencies);
 * @param cb The function that should be executed whenever this hook is called. [React EffectCallback](https://reactjs.org/docs/hooks-reference.html#useeffect)
 * @param dependencies A list of variables or functions that will initiate this hook when they are updated.
 */
const useAfterInitialEffect = (cb: EffectCallback, dependencies: DependencyList) => {
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return cb();
    ref.current = true;
  }, dependencies);
};

export default useAfterInitialEffect;
