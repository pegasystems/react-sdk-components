// This file wraps various calls related to logging in, logging out, etc.
//  that use the auth.html/auth.js to do the work of logging in via OAuth 2.0.

// It utilizes a JS Class and private members to protect any sensitive tokens
//  and token obfuscation routines

import { isEmptyObject } from './common-utils';
import { getSdkConfig, SdkConfigAccess } from './config_access';
import PegaAuth from './auth';

declare const window: any;
declare const PCore: any;

// Meant to be a singleton...only one instance per page
class AuthManager {
  #ssKeyPrefix:string = 'rs';
  // will store the PegaAuth (OAuth 2.0 client library) instance
  #pegaAuth:any = null;

  #ssKeyConfigInfo:string = '';
  #ssKeySessionInfo:string = '';
  #ssKeyTokenInfo:string = '';
  #ssKeyState:string = `${this.#ssKeyPrefix}State`;
  #authConfig:any = {};
  #authDynState:any = {};
  #authHeader:string|null = null;

  // state that should be persisted across loads
  state:any = {usePopup:false, noInitialRedirect:false};
  bC11NBootstrapInProgress:boolean = false;
  bCustomAuth: boolean = false;
  #tokenInfo: any;
  #userInfo: any;
  onLoadDone: boolean = false;
  msReauthStart: any = null;
  initInProgress: boolean = false;
  isLoggedIn: boolean = false;
  // Whether to pass a session storage key or structure to auth library
  #usePASS: boolean = false;
  #beforeUnloadAdded: boolean = false;
  #tokenStorage: string = 'temp';
  #transform:boolean = true;
  #foldSpot: number = 2;

  constructor () {
    // Auth Manager specific state is saved within session storage as important in redirect and popup window scenarios
    this.#loadState();
  }

  #transformAndParse(ssKey, ssItem, bForce=false) {
    let obj = {};
    try {
      obj = JSON.parse(this.#transformer(ssKey, ssItem, false, bForce));
    } catch (e) {
      // fall thru and return empty object
    }
    return obj;
  }

  // helper routine to retrieve JSON object stored in a session storage key
  // a 2nd optional arg can also retrieve an individual attribute
  #getStorage(ssKey, sAttrib:string|null = null) {
    const ssItem = ssKey ? window.sessionStorage.getItem(ssKey) : null;
    let obj = {};
    if (ssItem) {
      try {
        obj = JSON.parse(ssItem);
      } catch (e) {
        obj = this.#transformAndParse(ssKey, ssItem, true);
      }
    }
    return sAttrib ? obj[sAttrib] : obj;
  }

  // helper routine to set storage to the passed in JSON
  #setStorage(ssKey, obj) {
    // Set storage only if obj is not empty, else delete the storage
    if (!obj || isEmptyObject(obj) ) {
      window.sessionStorage.removeItem(ssKey);
    } else {
      // const bClear = (ssKey === this.#ssKeyState || ssKey === this.#ssKeySessionInfo);
      const bClear = false;
      const sValue = bClear ? JSON.stringify(obj) : this.#transformer(ssKey, JSON.stringify(obj), true);
      window.sessionStorage.setItem(ssKey, sValue);
   }
  }

  #calcFoldSpot(s:string) {
    const nOffset = 1;
    const sChar = s.length > nOffset ? s.charAt(nOffset) : '2';
    const nSpot:number = parseInt(sChar,10);
    this.#foldSpot = Number.isNaN(nSpot) ? 2 : (nSpot % 4)+2;
  }

  // helper function to encode storage
  #transformer(ssKey:string, s:string, bIn:boolean, bForce:boolean=false) {
    const bTransform = bForce || this.#transform;
    const fnFold = (x:string) => {
      const nLen = x.length;
      const nExtra = nLen % this.#foldSpot;
      const nOffset = Math.floor(nLen / this.#foldSpot) + nExtra;
      const nRem = x.length - nOffset;
      return x.substring(bIn ? nOffset : nRem) + x.substring(0, bIn ? nOffset : nRem);
    };
    const bTknInfo = ssKey === this.#ssKeyTokenInfo;
    if (bTknInfo && !bIn && bTransform) {
      s = window.atob(fnFold(s));
    }
    // eslint-disable-next-line no-nested-ternary
    let result = bTransform ? (bIn ? window.btoa(s) : window.atob(s)) : s;
    if (bTknInfo && bIn && bTransform) {
      result = fnFold(window.btoa(result));
    }
    return result;
  }

  // Setter for authHeader (no getter)
  set authHeader(value:string|null) {
    this.#authHeader = value;
    // setAuthorizationHeader method not available til 8.8 so do safety check
    if( window.PCore?.getAuthUtils().setAuthorizationHeader ) {
      const authHdr:string = value===null ? '' : value;
      window.PCore.getAuthUtils().setAuthorizationHeader(authHdr);
    }
    this.#updateLoginStatus();
  }

  // Setter/getter for usePopupForRestOfSession
  set usePopupForRestOfSession(usePopup:boolean) {
    this.state.usePopup = usePopup;
    this.#setStorage(this.#ssKeyState, this.state);
  }

  get usePopupForRestOfSession() {
    return this.state.usePopup;
  }

  // Setter/getter for noInitialRedirect
  set noInitialRedirect(bNoInitialRedirect:boolean) {
    if (bNoInitialRedirect) {
      this.usePopupForRestOfSession = true;
    }
    this.state.noInitialRedirect = bNoInitialRedirect;
    this.#setStorage(this.#ssKeyState, this.state);
  }

  get noInitialRedirect() {
    return this.state.noInitialRedirect || false;
  }

  // Init/getter for loginStart
  set loginStart(msValue:number) {
    if( msValue ) {
      this.state.msLoginStart = msValue;
    } else if( this.state.msLoginStart ) {
        delete this.state.msLoginStart;
    }
    this.#setStorage(this.#ssKeyState, this.state);
  }

  get loginStart() {
    return this.state.msLoginStart || 0;
  }

  // Init/getter for reauthStart
  set reauthStart(msValue:number|null) {
    if( msValue ) {
      this.msReauthStart = msValue;
    } else if( this.msReauthStart ) {
        delete this.msReauthStart;
    }
    this.#setStorage(this.#ssKeyState, this.state);
  }

  get reauthStart() {
    return this.msReauthStart || 0;
  }

  // Setter for clientId
  set keySuffix(s:string) {
    this.state.sfx = s || undefined;
    this.#setStorage(this.#ssKeyState, this.state);
    if( s ) {
      // To make it a bit more obtuse reverse the string and use that as the actual suffix
      const sSfx = s.split("").reverse().join("");
      this.#ssKeyConfigInfo = `${this.#ssKeyPrefix}CI_${sSfx}`;
      this.#ssKeySessionInfo = `${this.#ssKeyPrefix}SI_${sSfx}`;
      this.#ssKeyTokenInfo = `${this.#ssKeyPrefix}TI_${sSfx}`;
      this.#calcFoldSpot(sSfx);
    }
  }

  isLoginExpired() {
    let bExpired = true;
    if( this.loginStart ) {
      const currTime = Date.now();
      bExpired = currTime - this.loginStart > 60000;
    }
    return bExpired;
  }

  /**
   * Clean up any session storage allocated for the user session.
   */
  clear(bFullReauth=false){
    if (!this.bCustomAuth) {
      this.#authHeader = null;
    }
    if( !bFullReauth ) {
      if( this.#usePASS ) {
        sessionStorage.removeItem(this.#ssKeyConfigInfo);
      } else {
        this.#authConfig={};
        this.#authDynState={};
      }
      sessionStorage.removeItem(this.#ssKeySessionInfo);
    }
    // Clear any established auth tokens
    this.#tokenInfo = null;
    sessionStorage.removeItem(this.#ssKeyTokenInfo);
    this.loginStart = 0;
    this.isLoggedIn = false;
    // reset the initial redirect as well by using this setter
    this.usePopupForRestOfSession = bFullReauth;
    this.keySuffix = '';
  }

  #doBeforeUnload() {
    // Safari and particularly Safari on mobile devices doesn't seem to load this on first main redirect or
    // reliably, so have moved to having PegaAuth manage writing all state props to session storage

    // eslint-disable-next-line no-console
    // console.log(`doBeforeUnload: On before unload handler invoked`);

    this.#setStorage(this.#ssKeyState, this.state);
    this.#setStorage(this.#ssKeySessionInfo, this.#authDynState);

    // If tokenStorage was always, token would already be there
    if( this.#tokenStorage === 'temp' ) {
      this.#setStorage(this.#ssKeyTokenInfo, this.#tokenInfo);
    }
  }

  #loadState() {
    // Note: State storage key doesn't have a client id associated with it
    const oState = this.#getStorage(this.#ssKeyState);
    if( oState ) {
      Object.assign(this.state, oState);
      if( this.state.sfx ) {
        // Setter sets up the ssKey values as well
        this.keySuffix = this.state.sfx;
      }
    }
  }

  // This is only called from initialize after #ssKey values are setup
  #doOnLoad() {
    if( !this.onLoadDone ) {

      // This authConfig state doesn't collide with other calculated static state...so load it first
      // Note: transform setting will have already been loaded into #authConfig at this point
      this.#authDynState = this.#getStorage(this.#ssKeySessionInfo);
      this.#tokenInfo = this.#getStorage(this.#ssKeyTokenInfo);
      if( this.#tokenStorage !== 'always' ) {
        sessionStorage.removeItem(this.#ssKeyTokenInfo);
        sessionStorage.removeItem(this.#ssKeySessionInfo);
      }
      this.onLoadDone = true;
    }
  }

  // Callback when auth dynamic state has changed. Decide whether to persisting it based on
  //  config settings
  #doAuthDynStateChanged() {
    // If tokenStorage is setup for always then always persist the auth dynamic state as well
    if( this.#tokenStorage === 'always' ) {
      this.#setStorage(this.#ssKeySessionInfo, this.#authDynState);
    }
  }

  /**
   * Initialize OAuth config structure members and create authMgr instance (if necessary)
   * bNew - governs whether to create new sessionStorage or load existing one
   */
  async #initialize( bNew:boolean = false ) {

    return new Promise<any>((resolve) => {
      if( !this.initInProgress && (bNew || isEmptyObject(this.#authConfig) || !this.#pegaAuth )) {
        this.initInProgress = true;
        getSdkConfig().then( sdkConfig => {
          const sdkConfigAuth:any = sdkConfig.authConfig;
          const sdkConfigServer:any = sdkConfig.serverConfig;

          let pegaUrl = sdkConfigServer.infinityRestServerUrl;
          const bNoInitialRedirect = this.noInitialRedirect;

          // Construct default OAuth endpoints (if not explicitly specified)
          if (pegaUrl) {
            // Cope with trailing slash being present
            if (!pegaUrl.endsWith('/')) {
              pegaUrl += '/';
            }
            if (!sdkConfigAuth.authorize) {
              sdkConfigAuth.authorize = `${pegaUrl}PRRestService/oauth2/v1/authorize`;
            }
            if (!sdkConfigAuth.token) {
              sdkConfigAuth.token = `${pegaUrl}PRRestService/oauth2/v1/token`;
            }
            if (!sdkConfigAuth.revoke) {
              sdkConfigAuth.revoke = `${pegaUrl}PRRestService/oauth2/v1/revoke`;
            }
            if( !sdkConfigAuth.redirectUri ) {
              sdkConfigAuth.redirectUri = `${window.location.origin}${window.location.pathname}`;
            }
            if (!sdkConfigAuth.userinfo) {
              const appAliasSeg = sdkConfigServer.appAlias ? `app/${sdkConfigServer.appAlias}/` : '';
              sdkConfigAuth.userinfo = `${pegaUrl}${appAliasSeg}api/oauthclients/v1/userinfo/JSON`;
            }
          }
          // Auth service alias
          if( !sdkConfigAuth.authService) {
            sdkConfigAuth.authService = "pega";
          }
          // mashupAuthService provides way to have a different auth service for embedded
          if( !sdkConfigAuth.mashupAuthService ) {
            sdkConfigAuth.mashupAuthService = sdkConfigAuth.authService;
          }

          // Construct path to auth.html (used for case when not doing a main window redirect)
          let sNoMainRedirectUri=sdkConfigAuth.redirectUri;
          const nLastPathSep = sNoMainRedirectUri.lastIndexOf("/");
          sNoMainRedirectUri = nLastPathSep !== -1 ? `${sNoMainRedirectUri.substring(0,nLastPathSep+1)}auth.html` : `${sNoMainRedirectUri}/auth.html`;

          const portalGrantType = sdkConfigAuth.portalGrantType || 'authCode';
          const mashupGrantType = sdkConfigAuth.mashupGrantType || 'authCode';

          const pegaAuthConfig:any = {
            clientId: bNoInitialRedirect ? sdkConfigAuth.mashupClientId : sdkConfigAuth.portalClientId,
            grantType: bNoInitialRedirect ? mashupGrantType : portalGrantType,
            tokenUri: sdkConfigAuth.token,
            revokeUri: sdkConfigAuth.revoke,
            userinfoUri: sdkConfigAuth.userinfo,
            authService: bNoInitialRedirect ? sdkConfigAuth.mashupAuthService : sdkConfigAuth.authService,
            appAlias: sdkConfigServer.appAlias || '',
            useLocking: true
          };
          // Invoke keySuffix setter
          // Was using pegaAuthConfig.clientId as key but more secure to just use a random string as getting
          //  both a clientId and the refresh token could yield a new access token.
          // Suffix is so we might in future move to an array of suffixes based on the appName, so might store
          //  both portal and embedded tokens/session info at same time
          if( !this.state?.sfx ) {
            // Just using a random number to make the suffix unique on each session
            this.keySuffix = `${Math.ceil(Math.random()*100000000)}`;
          }
          this.#authConfig.transform = sdkConfigAuth.transform !== undefined ? sdkConfigAuth.transform : this.#transform;
          // Using property in class as authConfig may be empty at times
          this.#transform = this.#authConfig.transform;
          if( sdkConfigAuth.tokenStorage !== undefined ) {
            this.#tokenStorage = sdkConfigAuth.tokenStorage;
          }
          // If tokenStorage is set to "temp", this will not work reliably with mobile browsers...so check
          //  for browsers which don't support this and for those opt for always.
          if( this.#tokenStorage === 'temp' ) {
            const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
            if( isSafari ) {
              this.#tokenStorage = 'always';
            }
          }

          // Get latest state once client ids, transform and tokenStorage have been established
          this.#doOnLoad();

          // If no clientId is specified assume not OAuth but custom auth
          if( !pegaAuthConfig.clientId ) {
            this.bCustomAuth = true;
            return;
          }
          if( pegaAuthConfig.grantType === 'authCode' ) {
            const authCodeProps:any = {
              authorizeUri: sdkConfigAuth.authorize,
              // If we have already specified a redirect on the authorize redirect, we need to continue to use that
              //  on token endpoint
              redirectUri: bNoInitialRedirect || this.usePopupForRestOfSession ? sNoMainRedirectUri : sdkConfigAuth.redirectUri
            };
            if( 'silentTimeout' in sdkConfigAuth ) {
              authCodeProps.silentTimeout = sdkConfigAuth.silentTimeout;
            }
            if( bNoInitialRedirect && pegaAuthConfig.authService === 'pega' &&
              sdkConfigAuth.mashupUserIdentifier && sdkConfigAuth.mashupPassword ) {
              authCodeProps.userIdentifier = sdkConfigAuth.mashupUserIdentifier;
              authCodeProps.password = sdkConfigAuth.mashupPassword;
            }
            if( 'iframeLoginUI' in sdkConfigAuth ){
              authCodeProps.iframeLoginUI = sdkConfigAuth.iframeLoginUI.toString().toLowerCase() === 'true';
            }
            Object.assign(pegaAuthConfig, authCodeProps);
          }
          Object.assign(this.#authConfig, pegaAuthConfig);

          // Add an on before unload handler to write out key properties that we want to survive a
          //  browser reload
          if (!this.#beforeUnloadAdded && (!this.#usePASS || this.#tokenStorage !== 'always')) {
            window.addEventListener('beforeunload', this.#doBeforeUnload.bind(this));
            this.#beforeUnloadAdded = true;
          }

          // Initialise PegaAuth OAuth 2.0 client library
          if( this.#usePASS ) {
            this.#setStorage(this.#ssKeyConfigInfo, this.#authConfig);
            this.#setStorage(this.#ssKeySessionInfo, this.#authDynState);
            this.#pegaAuth = new PegaAuth(this.#ssKeyConfigInfo, this.#ssKeySessionInfo);
          } else {
            this.#authConfig.fnDynStateChangedCB = this.#doAuthDynStateChanged.bind(this);
            this.#pegaAuth = new PegaAuth(this.#authConfig, this.#authDynState);
          }
          this.initInProgress = false;
          resolve(this.#pegaAuth);
        });
      } else {
        let idNextCheck: ReturnType<typeof setInterval>;
        const fnCheckForAuthMgr = () => {
          if( !this.initInProgress ) {
            if( idNextCheck ) {
              clearInterval(idNextCheck);
            }
            resolve(this.#pegaAuth);
          }
        };
        fnCheckForAuthMgr();
        idNextCheck = setInterval(fnCheckForAuthMgr, 100);
      }
    });
  }

  /**
   * Initiate the process to get the Constellation bootstrap shell loaded and initialized
   * @param {Object} authConfig
   * @param {Object} tokenInfo
   * @param {Function} authTokenUpdated - callback invoked when Constellation JS Engine silently updates
   *      an expired access_token
   * @param {Function} fnReauth - callback invoked when a full or custom reauth is needed
   */
  #constellationInit(authConfig, tokenInfo, authTokenUpdated, fnReauth) {
    const constellationBootConfig:any = {};
    const sdkConfigServer = SdkConfigAccess.getSdkConfigServer();

    // Set up constellationConfig with data that bootstrapWithAuthHeader expects
    constellationBootConfig.customRendering = true;
    constellationBootConfig.restServerUrl = sdkConfigServer.infinityRestServerUrl;
    // NOTE: Needs a trailing slash! So add one if not provided
    if( !sdkConfigServer.sdkContentServerUrl.endsWith('/') ) {
      sdkConfigServer.sdkContentServerUrl = `${sdkConfigServer.sdkContentServerUrl}/`;
    }
    constellationBootConfig.staticContentServerUrl = `${sdkConfigServer.sdkContentServerUrl}constellation/`;
    if( !constellationBootConfig.staticContentServerUrl.endsWith('/') ) {
      constellationBootConfig.staticContentServerUrl = `${constellationBootConfig.staticContentServerUrl}/`;
    }
    // If appAlias specified, use it
    if( sdkConfigServer.appAlias ) {
      constellationBootConfig.appAlias = sdkConfigServer.appAlias;
    }

    if( tokenInfo ) {
      // Pass in auth info to Constellation
      constellationBootConfig.authInfo = {
        authType: "OAuth2.0",
        tokenInfo,
        // Set whether we want constellation to try to do a full re-Auth or not ()
        // true doesn't seem to be working in SDK scenario so always passing false for now
        popupReauth: false /* !this.noInitialRedirect */,
        client_id: authConfig.clientId,
        authentication_service: authConfig.authService,
        redirect_uri: authConfig.redirectUri,
        endPoints: {
            authorize: authConfig.authorizeUri,
            token: authConfig.tokenUri,
            revoke: authConfig.revokeUri
        },
        // TODO: setup callback so we can update own storage
        onTokenRetrieval: this.#authTokenUpdated.bind(this)
      }
    } else {
      constellationBootConfig.authorizationHeader = this.#authHeader;
    }


    // Turn off dynamic load components (should be able to do it here instead of after load?)
    constellationBootConfig.dynamicLoadComponents = false;

    if( this.bC11NBootstrapInProgress ) {
      return;
    } else {
      this.bC11NBootstrapInProgress = true;
    }

    // Note that staticContentServerUrl already ends with a slash (see above), so no slash added.
    // In order to have this import succeed and to have it done with the webpackIgnore magic comment tag.
    // See:  https://webpack.js.org/api/module-methods/
    import(/* webpackIgnore: true */ `${constellationBootConfig.staticContentServerUrl}bootstrap-shell.js`).then((bootstrapShell) => {
      // NOTE: once this callback is done, we lose the ability to access loadMashup.
      //  So, create a reference to it
      window.myLoadMashup = bootstrapShell.loadMashup;
      window.myLoadPortal = bootstrapShell.loadPortal;
      window.myLoadDefaultPortal = bootstrapShell.loadDefaultPortal;

      bootstrapShell.bootstrapWithAuthHeader(constellationBootConfig, 'pega-root').then(() => {
        // eslint-disable-next-line no-console
        console.log('ConstellationJS bootstrap successful!');
        this.bC11NBootstrapInProgress = false;

        // Setup listener for the reauth event
        if( tokenInfo ) {
          PCore.getPubSubUtils().subscribe(PCore.getConstants().PUB_SUB_EVENTS.EVENT_FULL_REAUTH, fnReauth, "authFullReauth");
        } else {
          // customReauth event introduced with 8.8
          const sEvent = PCore.getConstants().PUB_SUB_EVENTS.EVENT_CUSTOM_REAUTH;
          if( sEvent ) {
            PCore.getPubSubUtils().subscribe(sEvent, fnReauth, "doReauth");
          }
        }

        // Fire SdkConstellationReady event so bridge and app route can do expected post PCore initializations
        const event = new CustomEvent('SdkConstellationReady', {});
        document.dispatchEvent(event);
      })
      .catch( e => {
        // Assume error caught is because token is not valid and attempt a full reauth
        // eslint-disable-next-line no-console
        console.error(`ConstellationJS bootstrap failed. ${e}`);
        this.bC11NBootstrapInProgress = false;
        fnReauth();
      })
    });
    /* Ends here */

  }

  #customConstellationInit( fnReauth ) {
    this.#constellationInit( null, null, null, fnReauth);
  }

  #fireTokenAvailable(token, bLoadC11N=true) {
    if( !token ) {
      // This is used on page reload to load the token from sessionStorage and carry on
      token = this.#tokenInfo;
      if( !token ) {
        return;
      }
    }

    this.#tokenInfo = token;
    if( this.#tokenStorage === 'always') {
      this.#setStorage( this.#ssKeyTokenInfo, this.#tokenInfo );
    }
    this.#updateLoginStatus();

    // this.isLoggedIn is getting updated in updateLoginStatus
    this.isLoggedIn = true;
    this.loginStart = 0;
    this.usePopupForRestOfSession = true;

    if( !window.PCore && bLoadC11N ) {
      this.#constellationInit( this.#authConfig, token, this.#authTokenUpdated.bind(this), this.#authFullReauth.bind(this) );
    }

    /*
    // Create and dispatch the SdkLoggedIn event to trigger constellationInit
    const event = new CustomEvent('SdkLoggedIn', { detail: { authConfig, tokenInfo: token } });
    document.dispatchEvent(event);
    */
  }

  #processTokenOnLogin(token, bLoadC11N=true) {
    this.#tokenInfo = token;
    if( this.#tokenStorage === 'always' ) {
      this.#setStorage(this.#ssKeyTokenInfo, this.#tokenInfo);
    }
    if( window.PCore ) {
      PCore.getAuthUtils().setTokens(token);
    } else {
      this.#fireTokenAvailable(token, bLoadC11N);
    }
  }

  updateRedirectUri(sRedirectUri:string) {
    this.#authConfig.redirectUri = sRedirectUri;
  }

  /**
   * Get available portals which supports SDK
   * @returns list of available portals (portals other than excludingPortals list)
   */
  async getAvailablePortals() {

    return getSdkConfig().then( sdkConfig => {

      const serverConfig = sdkConfig.serverConfig;

      const userAccessGroup = PCore.getEnvironmentInfo().getAccessGroup();
      const dataPageName = 'D_OperatorAccessGroups';
      const serverUrl = serverConfig.infinityRestServerUrl;
      const appAlias = serverConfig.appAlias;
      const appAliasPath = appAlias ? `/app/${appAlias}` : '';
      const arExcludedPortals = serverConfig['excludePortals'];
      // eslint-disable-next-line no-undef
      const headers: HeadersInit = {
        Authorization: this.#authHeader===null ? '': this.#authHeader,
        'Content-Type': 'application/json'
      };

      // Using v1 API here as v2 data_views is not able to access same data page currently.  Should move to avoid having this logic to find
      //  a default portal or constellation portal and rather have Constellation JS Engine API just load the default portal
      return fetch(`${serverUrl}${appAliasPath}/api/v1/data/${dataPageName}`, {
        method: 'GET',
        headers
      })
        .then(response => {
          if (response.ok && response.status === 200) {
            return response.json();
          } else {
            if (response.status === 401) {
              // Might be either a real token expiration or revoke, but more likely that the "api" service package is misconfigured
              throw new Error(
                `Attempt to access ${dataPageName} failed.  The "api" service package is likely not configured to use "OAuth 2.0"`
              );
            }
            throw new Error(`HTTP Error: ${response.status}`);
          }
        })
        .then(async agData => {
          const arAccessGroups = agData.pxResults;
          const availablePortals:Array<Object> = [];

          for (const ag of arAccessGroups) {
            if (ag.pyAccessGroup === userAccessGroup) {
              // eslint-disable-next-line no-console
              console.error(
                `Default portal for current operator (${ag.pyPortal}) is not compatible with SDK.\nConsider using a different operator, adjusting the default portal for this operator, or using "appPortal" setting within sdk-config.json to specify a specific portal to load.`
              );
              let portal:any = null;
              for (portal of ag.pyUserPortals) {
                if (!arExcludedPortals.includes(portal.pyPortalLayout)) {
                  availablePortals.push(portal.pyPortalLayout);
                }
              }
              break;
            }
          }

          // Found operator's current access group. Use its portal
          // eslint-disable-next-line no-console
          console.log(`Available portals: ${availablePortals}`);

          return availablePortals;
        })
        .catch(e => {
          // eslint-disable-next-line no-console
          console.error(e.message);
          // check specific error if 401, and wiped out if so stored token is stale.  Fetch new tokens.
        });
    });
  }

  #updateLoginStatus() {
    if( !this.#authHeader  && this.#tokenInfo?.access_token) {
      // Use setter to set this securely
      this.authHeader = `${this.#tokenInfo.token_type} ${this.#tokenInfo.access_token}`;
    }
    this.isLoggedIn = !!(this.#authHeader && this.#authHeader.length > 0);
  }

  // Initiate a full OAuth re-authorization (any refresh token has also expired).
  #authFullReauth() {
    const bHandleHere = true; // Other alternative is to raise an event and have someone else handle it

    if( this.reauthStart ) {
      const reauthIgnoreInterval = 300000; // 5 minutes
      const currTime = Date.now();
      const bReauthInProgress = currTime - this.reauthStart <= reauthIgnoreInterval;
      if( bReauthInProgress ) {
        return;
      }
    }

    if( bHandleHere ) {
      // Don't want to do a full clear of authMgr as will loose state props (like sessionIndex).  Rather just clear the tokens
      this.clear(true);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      login(true);
    } else {
      // Fire the SdkFullReauth event to indicate a new token is needed (PCore.getAuthUtils.setTokens method
      //  should be used to communicate the new token to Constellation JS Engine.
      const event = new CustomEvent('SdkFullReauth', { detail: this.#processTokenOnLogin.bind(this) });
      document.dispatchEvent(event);
    }
  }

  // Passive update where just session storage is updated so can be used on a window refresh
  #authTokenUpdated( tokenInfo ){
    this.#tokenInfo = tokenInfo;
  };

  // TODO: Cope with 401 and refresh token if possible (or just hope that it succeeds during login)
  /**
   * Retrieve UserInfo for current authentication service
   */
  getUserInfo() {
    if( this.#userInfo ) {
      return this.#userInfo;
    }
    return this.#initialize(false).then( (aMgr) => {
      return aMgr.getUserinfo(this.#tokenInfo.access_token).then( data => {
        this.#userInfo = data;
        return this.#userInfo;
      });
    });
  }

  login( bFullReauth=false ){
    if( this.bCustomAuth ) return;

    // Needed so a redirect to login screen and back will know we are still in process of logging in
    this.loginStart = Date.now();

    this.#initialize(!bFullReauth).then( (aMgr) => {
      const bMainRedirect = !this.noInitialRedirect;
      const sdkConfigAuth = SdkConfigAccess.getSdkConfigAuth();
      let sRedirectUri=sdkConfigAuth.redirectUri;

      // If initial main redirect is OK, redirect to main page, otherwise will authorize in a popup window
      if (bMainRedirect && !bFullReauth) {
        // update redirect uri to be the root
        this.updateRedirectUri(sRedirectUri);
        aMgr.loginRedirect();
        // Don't have token til after the redirect
        return Promise.resolve(undefined);
      } else {
        // Construct path to redirect uri
        const nLastPathSep = sRedirectUri.lastIndexOf("/");
        sRedirectUri = nLastPathSep !== -1 ? `${sRedirectUri.substring(0,nLastPathSep+1)}auth.html` : `${sRedirectUri}/auth.html`;
        // Set redirectUri to static auth.html
        this.updateRedirectUri(sRedirectUri);
        return new Promise( (resolve, reject) => {
          aMgr.login().then(token => {
              this.#processTokenOnLogin(token);
              // this.getUserInfo();
              resolve(token.access_token);
          }).catch( (e) => {
              // Use setter to update state
              this.loginStart = 0;
              // eslint-disable-next-line no-console
              console.log(e);
              reject(e);
          });
        });
      }
    });

  }

  authRedirectCallback( href, fnLoggedInCB:any=null ) {
    // Get code from href and swap for token
    const aHrefParts = href.split('?');
    const urlParams = new URLSearchParams(aHrefParts.length>1 ? `?${aHrefParts[1]}` : '');
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    // If state should also match before accepting code
    if( code ) {
      this.#initialize(false).then( (aMgr) => {
        if( aMgr.checkStateMatch(state) ) {
          aMgr.getToken(code).then(token => {
            if( token && token.access_token ) {
                this.#processTokenOnLogin(token, false);
                // this.getUserInfo();
                if( fnLoggedInCB ) {
                    fnLoggedInCB(token.access_token);
                }
            }
          });
        }
      });
    } else {
      const error = urlParams.get('error');
      const errorDesc = urlParams.get('errorDesc');
      fnLoggedInCB(null, error, errorDesc);
    }
  }

  loginIfNecessary(appName:string, noMainRedirect:boolean=false, deferLogin:boolean=false){
    // We need to load state before making any decisions
    this.#loadState();
    // If no initial redirect status of page changed...clear AuthMgr
    const currNoMainRedirect = this.noInitialRedirect;
    if( appName !== this.state.appName || noMainRedirect !== currNoMainRedirect) {
      this.clear(false);
      this.state.appName = appName;
      this.#setStorage(this.#ssKeyState, this.state);
    }
    this.noInitialRedirect = noMainRedirect;
    // setNoInitialRedirect(noMainRedirect);
    // If custom auth no need to do any OAuth logic
    if( this.bCustomAuth ) {
      this.#updateLoginStatus();
      if( !window.PCore ) {
        this.#customConstellationInit( () => {
          // Fire the SdkCustomReauth event to indicate a new authHeader is needed. Event listener should invoke sdkSetAuthHeader
          //  to communicate the new token to sdk (and Constellation JS Engine)
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          const event = new CustomEvent('SdkCustomReauth', { detail: sdkSetAuthHeader });
          document.dispatchEvent(event);
        } );
      }
      return;
    }
    if( window.location.href.includes("?code") ) {
      // initialize authMgr (now initialize in constructor?)
      return this.#initialize(false).then(()=> {
          this.authRedirectCallback(window.location.href, ()=> {
            window.location.href = window.location.pathname;
          });
        // });
      });
    }
    if( !deferLogin && (!this.loginStart || this.isLoginExpired()) ) {
      return this.#initialize(false).then(() => {
          this.#updateLoginStatus();
          if( this.isLoggedIn ) {
            this.#fireTokenAvailable(this.#tokenInfo);
            // this.getUserInfo();
          } else {
            return this.login();
          }
        // });
      });
    }
  }


  logout(){
    sessionStorage.removeItem('rsdk_portalName');
    return new Promise((resolve) => {
      const fnClearAndResolve = () => {
        this.clear();

        const event = new Event('SdkLoggedOut');
        document.dispatchEvent(event);

        resolve(null);
      };
      if( this.bCustomAuth ) {
        fnClearAndResolve();
        return;
      }
     if( this.#tokenInfo && this.#tokenInfo.access_token ) {
          if( window.PCore ) {
              window.PCore.getAuthUtils().revokeTokens().then(() => {
                  fnClearAndResolve();
              }).catch(err => {
                  // eslint-disable-next-line no-console
                  console.log("Error:",err?.message);
              });
          } else {
            this.#initialize(false).then( (aMgr) => {
              aMgr.revokeTokens(this.#tokenInfo.access_token, this.#tokenInfo.refresh_token)
              .then(() => {
                // Go to finally
              })
              .finally(() => {
                fnClearAndResolve();
              });
            });
          }
      } else {
          fnClearAndResolve();
      }
    });
  }

}

const gAuthMgr = new AuthManager();


// TODO: Cope with 401 and refresh token if possible (or just hope that it succeeds during login)
/**
 * Retrieve UserInfo for current authentication service
 */
export const getUserInfo = () => {
  return gAuthMgr.getUserInfo();
};

export const login = (bFullReauth=false) => {
  return gAuthMgr.login( bFullReauth );
};

export const authRedirectCallback = ( href, fnLoggedInCB:any=null ) => {
  gAuthMgr.authRedirectCallback( href, fnLoggedInCB );
};

/**
 * Silent or visible login based on login status
 *  @param {string} appName - unique name for application route (will be used to clear an session storage for another route)
 *  @param {boolean} noMainRedirect - avoid the initial main window redirect that happens in scenarios where it is OK to transition
 *   away from the main page
 *  @param {boolean} deferLogin - defer logging in (if not already authenticated)
 */
export const loginIfNecessary = (appName, noMainRedirect=false, deferLogin=false) => {
  gAuthMgr.loginIfNecessary( appName, noMainRedirect, deferLogin );
};

export const getHomeUrl = () => {
  return `${window.location.origin}/`;
};


export const authIsMainRedirect = () => {
  // Even with main redirect, we want to use it only for the first login (so it doesn't wipe out any state or the reload)
  return !gAuthMgr.noInitialRedirect && !gAuthMgr.usePopupForRestOfSession;
};

export const sdkIsLoggedIn = () => {
  return gAuthMgr.isLoggedIn;
}

export const logout = () => {
  return gAuthMgr.logout();
};

// Set the custom authorization header for the SDK (and Constellation JS Engine) to
// utilize for every DX API request
export const sdkSetAuthHeader = (authHeader) => {
  gAuthMgr.bCustomAuth = !!authHeader;
  // Use setter to set this securely
  gAuthMgr.authHeader = authHeader;
};

export const getAvailablePortals = async () => {
  return gAuthMgr.getAvailablePortals();
};
