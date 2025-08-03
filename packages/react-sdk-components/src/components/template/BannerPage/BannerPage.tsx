import { Children, PropsWithChildren, useMemo } from 'react';

import LazyLoad from '../../../bridge/LazyLoad';
import { PConnProps } from '../../../types/PConnProps';

interface BannerPageProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  layout?: string;
  heading?: string;
  message?: string;
  imageTheme?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  tintImage?: boolean;
}

/*
 * BannerPage template.
 */
export default function BannerPage(props: PropsWithChildren<BannerPageProps>) {
  const {
    children,
    layout = 'two-column',
    heading = '',
    message = '',
    imageTheme = 'light',
    backgroundImage = '',
    backgroundColor = '',
    tintImage = false
  } = props;

  const childArray = useMemo(() => {
    return Children.toArray(children);
  }, [children]);

  return (
    <LazyLoad
      componentName='Banner'
      variant={layout}
      a={childArray[0]}
      b={childArray[1]}
      banner={{
        variant: imageTheme,
        backgroundColor,
        title: heading,
        message,
        backgroundImage,
        tintImage
      }}
    />
  );
}
