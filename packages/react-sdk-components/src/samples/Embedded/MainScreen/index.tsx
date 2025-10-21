import { useEffect, useMemo, useState } from 'react';
import { getSdkConfig } from '@pega/auth/lib/sdk-auth-manager';
import { makeStyles } from '@mui/styles';

import StoreContext from '../../../bridge/Context/StoreContext';
import createPConnectComponent from '../../../bridge/react_pconnect';

import ShoppingOptionCard from '../ShoppingOptionCard';
import ResolutionScreen from '../ResolutionScreen';
import { shoppingOptions } from '../utils';

const useStyles = makeStyles({
  appContainer: {
    backgroundColor: '#100a2a',
    fontFamily: "'Poppins', sans-serif",
    color: '#e0e0e0',
    minHeight: 'calc(100vh - 50px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },

  '@global': {
    '.psdk-flow-container-top': {
      maxWidth: '1400px',
      width: '50%',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: '5%',
      padding: 0
    }
  },

  mainContentArea: {
    padding: '4rem 0',
    width: '100%'
  },
  mainContainer: {
    width: '90%',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    marginBottom: '6rem',
    '@media (max-width: 992px)': {
      flexDirection: 'column',
      textAlign: 'center'
    }
  },
  heroText: {
    flexBasis: '50%',
    '& h1': {
      fontSize: '3.5rem',
      lineHeight: 1.2,
      fontWeight: 700,
      color: '#ffffff'
    }
  },
  heroImage: {
    flexBasis: '45%',
    textAlign: 'right',
    '& img': {
      maxWidth: '100%',
      height: 'auto'
    },
    '@media (max-width: 992px)': {
      textAlign: 'center'
    }
  },
  plansSection: {
    display: 'flex',
    gap: '3rem',
    alignItems: 'flex-start',
    '@media (max-width: 1200px)': {
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center'
    }
  },
  plansIntro: {
    flexBasis: '25%',
    paddingRight: '2rem',
    '& h2': {
      fontSize: '2.8rem',
      lineHeight: 1.3,
      fontWeight: 700,
      color: '#ffffff'
    },
    '@media (max-width: 1200px)': {
      paddingRight: 0,
      marginBottom: '2rem'
    }
  },
  highlight: {
    color: '#d43592'
  },
  plansContainer: {
    flexBasis: '75%',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    '@media (max-width: 992px)': {
      gridTemplateColumns: '1fr',
      width: '100%',
      maxWidth: '400px'
    }
  },
  pegaViewContainer: {
    width: '100%'
  },
  pegaForm: {}
});

function RootComponent(props) {
  const PegaConnectObj = createPConnectComponent();
  const thePConnObj = <PegaConnectObj {...props} />;
  const contextValue = useMemo(() => {
    return { store: PCore.getStore(), displayOnlyFA: true };
  }, []);
  return <StoreContext.Provider value={contextValue}>{thePConnObj}</StoreContext.Provider>;
}

export default function MainScreen(props) {
  const classes = useStyles();
  const [showPega, setShowPega] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showResolution, setShowResolution] = useState(false);

  useEffect(() => {
    PCore.getPubSubUtils().subscribe(PCore.getConstants().PUB_SUB_EVENTS.EVENT_CANCEL, () => cancelAssignment(), 'cancelAssignment');
    PCore.getPubSubUtils().subscribe(
      PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.END_OF_ASSIGNMENT_PROCESSING,
      () => assignmentFinished(),
      'endOfAssignmentProcessing'
    );
    return () => {
      PCore.getPubSubUtils().unsubscribe(PCore.getConstants().PUB_SUB_EVENTS.EVENT_CANCEL, 'cancelAssignment');
      PCore.getPubSubUtils().unsubscribe(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.END_OF_ASSIGNMENT_PROCESSING, 'endOfAssignmentProcessing');
    };
  }, []);

  const cancelAssignment = () => {
    setShowLandingPage(true);
    setShowPega(false);
  };

  const assignmentFinished = () => {
    setShowResolution(true);
    setShowPega(false);
  };

  const onShopNow = async optionClicked => {
    setShowLandingPage(false);
    setShowPega(true);
    const sdkConfig = await getSdkConfig();
    let mashupCaseType = sdkConfig.serverConfig.appMashupCaseType;
    if (!mashupCaseType) {
      const caseTypes = PCore.getEnvironmentInfo()?.environmentInfoObject?.pyCaseTypeList;
      if (caseTypes && caseTypes.length > 0) {
        mashupCaseType = caseTypes[0].pyWorkTypeImplementationClassName;
      }
    }
    const options: {
      pageName: string;
      startingFields: { [key: string]: any };
    } = {
      pageName: 'pyEmbedAssignment',
      startingFields: {}
    };
    if (mashupCaseType === 'DIXL-MediaCo-Work-NewService') {
      options.startingFields.Package = optionClicked;
    }
    PCore.getMashupApi()
      .createCase(mashupCaseType, PCore.getConstants().APP.APP, options)
      .then(() => {
        console.log('createCase rendering is complete');
      });
  };

  function renderLandingPage() {
    return (
      <div className={classes.mainContentArea}>
        <main className={classes.mainContainer}>
          <section className={classes.hero}>
            <div className={classes.heroText}>
              <h1>
                Keeping you connected
                <br />
                to what matters.
              </h1>
            </div>
            <div className={classes.heroImage}>
              <img src='./assets/img/SDKdevicesImage 2.png' alt='Smartphone, Tablet, and Laptop' />
            </div>
          </section>
          <section className={classes.plansSection}>
            <div className={classes.plansIntro}>
              <h2>
                {}
                The phones you want at prices you'll <span className={classes.highlight}>love.</span>
              </h2>
            </div>
            <div className={classes.plansContainer}>
              {shoppingOptions.map(option => (
                <ShoppingOptionCard key={option.level} {...option} onClick={onShopNow} />
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  function renderPegaView() {
    return (
      <div className={classes.pegaViewContainer}>
        <div className={classes.pegaForm} id='pega-part-of-page'>
          <RootComponent {...props} />
          <br />
        </div>
      </div>
    );
  }

  return (
    <div className={classes.appContainer}>
      {showLandingPage && renderLandingPage()}
      {showResolution && <ResolutionScreen />}
      {showPega && renderPegaView()}
    </div>
  );
}
