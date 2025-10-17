import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  resolutionPage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 81px)',
    padding: '2rem'
  },
  resolutionCard: {
    backgroundColor: '#211649',
    borderRadius: '16px',
    padding: '3rem',
    maxWidth: '600px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    color: '#e0e0e0',
    position: 'relative',
    border: '2px solid transparent',
    backgroundClip: 'padding-box',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '16px',
      border: '2px solid transparent',
      background: 'linear-gradient(to bottom, #8A2BE2, #d43592) border-box',
      '-webkit-mask': 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
      '-webkit-mask-composite': 'destination-out',
      maskComposite: 'exclude',
      pointerEvents: 'none'
    }
  },
  successImage: {
    height: '4rem',
    width: 'auto',
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '2rem',
    color: '#ffffff',
    marginBottom: '1rem',
    fontWeight: 700,
    margin: 0
  },
  message: {
    fontSize: '1rem',
    lineHeight: 1.6,
    marginBottom: '2rem',
    color: '#8e8e9c',
    margin: 0
  },
  doneButton: {
    display: 'inline-block',
    background: 'linear-gradient(90deg, #d43592, #a445b2, #d43592)',
    backgroundSize: '200% auto',
    color: '#ffffff !important',
    padding: '0.75rem 1.5rem',
    borderRadius: '50px',
    textAlign: 'center',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-position 0.4s ease-in-out, transform 0.3s ease',
    '&:hover': {
      backgroundPosition: 'right center',
      transform: 'scale(1.05)',
      color: '#ffffff'
    }
  }
});

export default function ResolutionScreen() {
  const classes = useStyles();

  return (
    <div className={classes.resolutionPage}>
      <div className={classes.resolutionCard}>
        <img src='./assets/img/SuccessIcon.png' alt='Success Checkmark' className={classes.successImage} />

        <h2 className={classes.title}>Get excited for your new phone!</h2>
        <p className={classes.message}>
          We have received your order of a new Phone. It will ship out within 1 business day to your address. Your tracking information will be sent
          to you.
          <br />
          <br />
          Thank you for your business!
        </p>

        <a href='/' className={classes.doneButton} role='button'>
          Done
        </a>
      </div>
    </div>
  );
}
