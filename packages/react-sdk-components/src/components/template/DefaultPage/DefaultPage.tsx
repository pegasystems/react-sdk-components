import { useMemo, Children } from 'react';
import type { ReactNode } from 'react';
import Banner from '../../designSystemExtension/Banner';

export interface CommonPageProps {
  /** Page title */
  title: string;

  /** Page icon */
  icon: string;

  /** Region children */
  children: ReactNode | ReactNode[];

  /** Dynamic page pconnect object */
  // getPConnect: () => PConnect;

  /** Enable GetNextWork in page */
  enableGetNextWork?: boolean;

  /** GetAI coaches configured in page */
  // coaches?: GenAICoach[];

  /** Locale reference */
  localeReference: string;
}
interface DefaultPageProps extends CommonPageProps {
  /** Default page layout one or two columns */
  layout: 'one-column' | 'two-column' | 'wide-narrow' | 'narrow-wide' | 'dynamic';

  /** Flag to enable banner/hero */
  enableBanner?: boolean;

  /** Banner - Heading displayed */
  heading?: string;

  /** Banner - Message displayed */
  message?: string;

  /** Banner - Theme of the image */
  imageTheme?: 'light' | 'dark' | undefined;

  /** Banner - Background image */
  backgroundImage?: string;

  /** Banner - Background color */
  backgroundColor?: string;

  /** Banner - Tint image */
  tintImage?: boolean;

  /** Flag to enable layout model */
  // layoutModel?: GridLayoutModel | undefined;
}

export default function DefaultPage({
  layout = 'one-column',
  children,
  enableBanner,
  heading = '',
  message = '',
  imageTheme,
  backgroundImage = '',
  backgroundColor = '',
  tintImage
}: DefaultPageProps) {
  const childArray = useMemo(() => {
    return Children.toArray(children);
  }, [children]);

  if (enableBanner) {
    return (
      <Banner
        variant={layout === 'one-column' ? 'two-column' : layout}
        a={[childArray[0]]}
        b={[childArray[1]]}
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
}
