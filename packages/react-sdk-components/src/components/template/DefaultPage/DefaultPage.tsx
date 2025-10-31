import { useMemo, Children } from 'react';
import type { ReactNode } from 'react';
import { Grid2 } from '@mui/material';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';

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

const COLUMNS_WIDTHS = {
  'one-column': [12],
  'two-column': [6, 6],
  'narrow-wide': [4, 8],
  'wide-narrow': [8, 4]
};

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
  const Banner = getComponentFromMap('Banner');

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

  return (
    <Grid2 container spacing={1}>
      {childArray.map((child, index) => (
        <Grid2 key={index} size={COLUMNS_WIDTHS[layout][index]}>
          {child}
        </Grid2>
      ))}
    </Grid2>
  );
}
