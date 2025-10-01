import { Grid2 } from '@mui/material';
import './Banner.css';

// AlertBanner is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps

interface BannerProps {
  // If any, enter additional props that only exist on this component
  a: any;
  b: any;
  banner: {
    variant: any;
    backgroundColor: any;
    title: any;
    message: any;
    backgroundImage: any;
    tintImage: any;
  };
  variant: any;
}

export default function Banner(props: BannerProps) {
  const { a, b, banner, variant } = props;
  const { title, message, backgroundImage } = banner;
  const variantMap = {
    'two-column': [6, 6],
    'narrow-wide': [4, 8],
    'wide-narrow': [8, 4]
  };
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className='background-image-style' style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className='background-style content'>
          <div>
            <h1 className='title'>{title}</h1>
            <p className='message'>{message}</p>
          </div>
        </div>
      </div>
      <Grid2 container size={12} className='banner-layout' spacing={1}>
        <Grid2 size={{ xs: variantMap[variant][0] }} style={{ padding: '1em' }}>
          {a}
        </Grid2>
        <Grid2 size={{ xs: variantMap[variant][1] }} style={{ padding: '1em' }}>
          {b}
        </Grid2>
      </Grid2>
    </div>
  );
}
