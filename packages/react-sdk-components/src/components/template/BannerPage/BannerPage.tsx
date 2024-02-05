import { Children, PropsWithChildren, useMemo } from 'react';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';

// BannerPage does NOT have getPConnect. So, no need to extend from PConnProps

interface BannerPageProps {
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
  // Get emitted components from map (so we can get any override that may exist)
  const Banner = getComponentFromMap('Banner');

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
    <Banner
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
