class PegaAuth {
    // The properties within config structure are expected to be more static config values that are then
    //  used to properly make various OAuth endpoint calls.
    #config = null;
    // Any dynamic state is stored separately in its own structure.  If a sessionStorage key is passed in
    //  without a Dynamic State key.
    #dynState = {};
    // Current properties within dynState structure:
    //  codeVerifier, state, sessionIndex, sessionIndexAttempts, acRedirectUri

    constructor(ssKeyConfig, ssKeyDynState) {
      if (typeof ssKeyConfig === 'string') {
        this.ssKeyConfig = ssKeyConfig;
        this.ssKeyDynState = ssKeyDynState || `${ssKeyConfig}_DS`;
        this.#reloadConfig();
      } else {
        // object with config structure is passed in
        this.#config = ssKeyConfig;
        this.#dynState = ssKeyDynState;
      }
      this.urlencoded = 'application/x-www-form-urlencoded';
      this.isNode = typeof window === 'undefined';

      // For isNode path the below attributes are initialized on first method invocation
      if (!this.isNode) {
        this.crypto = window.crypto;
        this.subtle = window.crypto.subtle;
      }
      if (Object.keys(this.#config).length > 0) {
        if (!this.#config.serverType) {
          this.#config.serverType = 'infinity';
        }
      } else {
        throw new Error('invalid config settings');
      }
    }

    #reloadSS(ssKey) {
      const sItem = window.sessionStorage.getItem(ssKey);
      let obj = {};
      if (sItem) {
        try {
          obj = JSON.parse(sItem);
        } catch (e) {
          try {
            obj = JSON.parse(atob(sItem));
          } catch (err) {
            obj = {};
          }
        }
      }
      if (ssKey === this.ssKeyConfig) {
        this.#config = sItem ? obj : {};
      } else {
        this.#dynState = sItem ? obj : {};
      }
    }

    #reloadConfig() {
      if (this.ssKeyConfig) {
       this. #reloadSS(this.ssKeyConfig);
      }
      if (this.ssKeyDynState) {
        this.#reloadSS(this.ssKeyDynState);
      }
    }

    #updateConfig() {
      // transform must occur unless it is explicitly disabled
      const transform = this.#config.transform !== false;
      // May not need to write out Config info all the time, but there is a scenario where a
      //  non obfuscated value is passed in and then it needs to be obfuscated
      if (this.ssKeyConfig) {
        const sConfig = JSON.stringify(this.#config);
        window.sessionStorage.setItem(this.ssKeyConfig, transform ? btoa(sConfig) : sConfig);
      }
      if (this.ssKeyDynState) {
        const sDynState = JSON.stringify(this.#dynState);
        window.sessionStorage.setItem(this.ssKeyDynState, transform ? btoa(sDynState) : sDynState);
      }
      if( this.#config.fnDynStateChangedCB ) {
        this.#config.fnDynStateChangedCB();
      }
    }

    async #importSingleLib(libName, libProp, bLoadAlways = false) {
      // eslint-disable-next-line no-undef
      if (!bLoadAlways && typeof (this.isNode ? global : window)[libProp] !== 'undefined') {
      // eslint-disable-next-line no-undef
      this[libProp] = (this.isNode ? global : window)[libProp];
        return this[libProp];
      }
      // Needed to explicitly make import argument a string by using template literals to fix a compile
      // error: Critical dependency: the request of a dependency is an expression
      return import(`${libName}`)
        .then((mod) => {
          this[libProp] = mod.default;
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(`Library ${libName} failed to load. ${e}`);
          throw e;
        });
    }

    async #importNodeLibs() {
      // Also current assumption is using Node 18 or better
      // With 18.3 there is now a native fetch (but may want to force use of node-fetch)
      const useNodeFetch = !!this.#config.useNodeFetch;

      return Promise.all([
        this.#importSingleLib('node-fetch', 'fetch', useNodeFetch),
        this.#importSingleLib('open', 'open'),
        this.#importSingleLib('node:crypto', 'crypto', true),
        this.#importSingleLib('node:https', 'https'),
        this.#importSingleLib('node:http', 'http'),
        this.#importSingleLib('node:fs', 'fs')
      ]).then(() => {
        this.subtle = this.crypto?.subtle || this.crypto.webcrypto.subtle;
        if ((typeof fetch === 'undefined' || useNodeFetch) && this.fetch) {
          /* eslint-disable-next-line no-global-assign */
          fetch = this.fetch;
        }
      });
    }

    // For PKCE the authorize includes a code_challenge & code_challenge_method as well
    async #buildAuthorizeUrl(state) {
      const {
        serverType,
        clientId,
        redirectUri,
        authorizeUri,
        authService,
        appAlias,
        userIdentifier,
        password,
        noPKCE,
        isolationId
      } = this.#config;
      const {
        sessionIndex,
      } = this.#dynState;
      const bInfinity = serverType === 'infinity';

      if (!noPKCE) {
        // Generate random string of 64 chars for verifier.  RFC 7636 says from 43-128 chars
        const buf = new Uint8Array(64);
        this.crypto.getRandomValues(buf);
        this.#dynState.codeVerifier = this.#base64UrlSafeEncode(buf);
      }

      // If sessionIndex exists then increment attempts count (we will stop sending session_index after two failures)
      // With Infinity '24 we can now properly detect a invalid_session_index error, but can't for earlier versions
      if (sessionIndex) {
        this.#dynState.sessionIndexAttempts += 1;
      }

      // We use state to verify that the received code is for the right authorize transaction
      // eslint-disable-next-line no-unneeded-ternary
      this.#dynState.state = `${state ? state : ''}.${this.#getRandomString(32)}`;

      // The same redirectUri needs to be provided to token endpoint, so save this away incase redirectUri is
      //  adjusted for next authorize
      this.#dynState.acRedirectUri = redirectUri;

      // Persist codeVerifier in session storage so it survives the redirects that are to follow
      this.#updateConfig();

      // Trim alias to include just the real alias piece
      const addtlScope = appAlias ? `+app.alias.${appAlias.replace(/^app\//, '')}` : '';
      const scope = bInfinity ? `openid${addtlScope}` : 'user_info';

      // Add explicit creds if specified to try to avoid login popup
      const authServiceArg = authService ? `&authentication_service=${encodeURIComponent(authService)}` : '';
      const sessionIndexArg =
        sessionIndex && this.#dynState.sessionIndexAttempts < 3 ? `&session_index=${sessionIndex}` : '';
      const userIdentifierArg = userIdentifier ? `&UserIdentifier=${encodeURIComponent(userIdentifier)}` : '';
      const passwordArg = password && userIdentifier ? `&Password=${encodeURIComponent(atob(password))}` : '';
      const moreAuthArgs = bInfinity
        ? `&enable_psyncId=true${authServiceArg}${sessionIndexArg}${userIdentifierArg}${passwordArg}`
        : `&isolationID=${isolationId}`;

      let pkceArgs = '';
      if (!noPKCE) {
        const cc = await this.#getCodeChallenge(this.#dynState.codeVerifier);
        pkceArgs = `&code_challenge=${cc}&code_challenge_method=S256`;
      }
      return `${authorizeUri}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&state=${
        this.#dynState.state
      }${pkceArgs}${moreAuthArgs}`;
    }

    async login() {
      if (this.isNode && !this.crypto) {
        // Deferring dynamic loading of node libraries til this first method to avoid doing this in constructor
        await this.#importNodeLibs();
      }
      const { grantType, noPKCE } = this.#config;
      if (grantType && grantType !== 'authCode') {
        return this.getToken();
      }
      // Make sure browser in a secure context, else PKCE will fail
      if (!this.isNode && !noPKCE && !window.isSecureContext) {
        throw new Error(
          `Authorization code grant flow failed due to insecure browser context at ${window.location.origin}.  Use localhost or https.`
        );
      }
      return this.#authCodeStart();
    }

    // authCode login issues the authorize endpoint transaction and deals with redirects
    async #authCodeStart() {
      const fnGetRedirectUriOrigin = () => {
        const redirectUri = this.#config.redirectUri;
        const nRootOffset = redirectUri.indexOf('//');
        const nFirstPathOffset = nRootOffset !== -1 ? redirectUri.indexOf('/', nRootOffset + 2) : -1;
        return nFirstPathOffset !== -1 ? redirectUri.substring(0, nFirstPathOffset) : redirectUri;
      };

      const redirectOrigin = fnGetRedirectUriOrigin();
      const state = this.isNode ? '' : btoa(window.location.origin);

      return new Promise((resolve, reject) => {
        let theUrl = null; // holds the crafted authorize url

        let myWindow = null; // popup or iframe
        let elIframe = null;
        let elCloseBtn = null;
        const iframeTimeout = this.#config.silentTimeout !== undefined ? this.#config.silentTimeout : 5000;
        let bWinIframe = true;
        let tmrAuthComplete = null;
        let checkWindowClosed = null;
        let bDisablePromptNone = false;
        const myWinOnLoad = () => {
          try {
            if (bWinIframe) {
              elIframe.contentWindow.postMessage({ type: 'PegaAuth' }, redirectOrigin);
            } else {
              myWindow.postMessage({ type: 'PegaAuth' }, redirectOrigin);
            }
          } catch (e) {
            // Exception trying to postMessage on load (perhaps should console.warn)
          }
        };
        const fnSetSilentAuthFailed = (bSet) => {
          this.#config.silentAuthFailed = bSet;
          this.#updateConfig();
        };
        /* eslint-disable prefer-promise-reject-errors */
        const fnOpenPopup = () => {
          if (this.#config.noPopups) {
            return reject('no-popups');
          }
          // Since displaying a visible window, clear the silent auth failed flag
          fnSetSilentAuthFailed(false);
          myWindow = (this.isNode ? this.open : window.open)(theUrl, '_blank', 'width=700,height=500,left=200,top=100');
          if (!myWindow) {
            // Blocked by popup-blocker
            return reject('blocked');
          }
          checkWindowClosed = setInterval(() => {
            if (myWindow.closed) {
              clearInterval(checkWindowClosed);
              reject('closed');
            }
          }, 500);
          if (!this.isNode) {
            try {
              myWindow.addEventListener('load', myWinOnLoad, true);
            } catch (e) {
              // Exception trying to add onload handler to opened window
              // eslint-disable-next-line no-console
              console.error(`Error adding event listener on popup window: ${e}`);
            }
          }
        };

        /* eslint-enable prefer-promise-reject-errors */
        const fnCloseIframe = () => {
          elIframe.parentNode.removeChild(elIframe);
          elCloseBtn.parentNode.removeChild(elCloseBtn);
          elIframe = null;
          elCloseBtn = null;
          bWinIframe = false;
        };

        const fnCloseAndReject = () => {
          fnCloseIframe();
          /* eslint-disable-next-line prefer-promise-reject-errors */
          reject('closed');
        };

        const fnAuthMessageReceiver = (event) => {
          // Check origin to make sure it is the redirect origin
          if (event.origin !== redirectOrigin) return;
          if (!event.data || !event.data.type || event.data.type !== 'PegaAuth') return;
          const aArgs = ['code', 'state', 'error', 'errorDesc'];
          const aValues = [];
          for (let i = 0; i < aArgs.length; i += 1) {
            const arg = aArgs[i];
            aValues[arg] = event.data[arg] ? event.data[arg].toString() : null;
          }
          if (aValues.error || (aValues.code && aValues.state === this.#dynState.state)) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            fnGetTokenAndFinish(aValues.code, aValues.error, aValues.errorDesc);
          }
        };

        const fnEnableMessageReceiver = (bEnable) => {
          if (bEnable) {
            window.addEventListener('message', fnAuthMessageReceiver, false);
            window.authCodeCallback = (code, state1, error, errorDesc) => {
              if (error || (code && state1 === this.#dynState.state)) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                fnGetTokenAndFinish(code, error, errorDesc);
              }
            };
          } else {
            window.removeEventListener('message', fnAuthMessageReceiver, false);
            delete window.authCodeCallback;
          }
        };

        const doAuthorize = () => {
          // If there is a userIdentifier and password specified or an external SSO auth service,
          //  we can try to use this silently in an iFrame first
          bWinIframe =
            !this.isNode &&
            !this.#config.silentAuthFailed &&
            iframeTimeout > 0 &&
            ((!!this.#config.userIdentifier && !!this.#config.password) ||
              this.#config.iframeLoginUI ||
              this.#config.authService !== 'pega');
          // Enable message receiver
          if (!this.isNode) {
            fnEnableMessageReceiver(true);
          }
          if (bWinIframe) {
            const nFrameZLevel = 99999;
            elIframe = document.createElement('iframe');
            elIframe.id = `pe${this.#config.clientId}`;
            const loginBoxWidth = 500;
            const loginBoxHeight = 700;
            const oStyle = elIframe.style;
            oStyle.position = 'absolute';
            oStyle.display = 'none';
            oStyle.zIndex = nFrameZLevel;
            oStyle.top = `${Math.round(Math.max(window.innerHeight - loginBoxHeight, 0) / 2)}px`;
            oStyle.left = `${Math.round(Math.max(window.innerWidth - loginBoxWidth, 0) / 2)}px`;
            oStyle.width = '500px';
            oStyle.height = '700px';
            // Add Iframe to top of document DOM to have it load
            document.body.insertBefore(elIframe, document.body.firstChild);
            // document.getElementsByTagName('body')[0].appendChild(elIframe);
            elIframe.addEventListener('load', myWinOnLoad, true);
            // Disallow iframe content attempts to navigate main window
            elIframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin');
            // Adding prompt=none as this is standard OIDC way to communicate no UI is expected (expecting Pega security to support this one day)
            elIframe.setAttribute('src', bDisablePromptNone ? theUrl : `${theUrl}&prompt=none`);

            const svgCloseBtn = `<?xml version="1.0" encoding="UTF-8"?>
                          <svg width="34px" height="34px" viewBox="0 0 34 34" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <title>Dismiss - Black</title>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                              <g transform="translate(1.000000, 1.000000)">
                                <circle fill="#252C32" cx="16" cy="16" r="16"></circle>
                                <g transform="translate(9.109375, 9.214844)" fill="#FFFFFF" fill-rule="nonzero">
                                  <path d="M12.7265625,0 L0,12.6210938 L1.0546875,13.5703125 L13.78125,1.0546875 L12.7265625,0 Z M13.7460938,12.5507812 L1.01953125,0 L0,1.01953125 L12.7617188,13.6054688 L13.7460938,12.5507812 Z"></path>
                                </g>
                              </g>
                            </g>
                          </svg>`;
            const bCloseWithinFrame = false;
            elCloseBtn = document.createElement('img');
            elCloseBtn.onclick = fnCloseAndReject;
            elCloseBtn.src = `data:image/svg+xml;base64,${btoa(svgCloseBtn)}`;
            const oBtnStyle = elCloseBtn.style;
            oBtnStyle.cursor = 'pointer';
            // If svg doesn't set width and height might want to set oBtStyle width and height to something like '2em'
            oBtnStyle.position = 'absolute';
            oBtnStyle.display = 'none';
            oBtnStyle.zIndex = nFrameZLevel + 1;
            const nTopOffset = bCloseWithinFrame ? 5 : -10;
            const nRightOffset = bCloseWithinFrame ? -34 : -20;
            const nTop = Math.round(Math.max(window.innerHeight - loginBoxHeight, 0) / 2) + nTopOffset;
            oBtnStyle.top = `${nTop}px`;
            const nLeft = Math.round(Math.max(window.innerWidth - loginBoxWidth, 0) / 2) + loginBoxWidth + nRightOffset;
            oBtnStyle.left = `${nLeft}px`;
            document.body.insertBefore(elCloseBtn, document.body.firstChild);
            // If the password was wrong, then the login screen will be in the iframe
            // ..and with Pega without realization of US-372314 it may replace the top (main portal) window
            // For now set a timer and if the timer expires, remove the iFrame and use same url within
            // visible window
            tmrAuthComplete = setTimeout(() => {
              clearTimeout(tmrAuthComplete);
              /*
              // remove password from config
              if (this.#config.password) {
                delete this.#config.password;
                this.#updateConfig();
              }
              */
              // Display the iframe where the redirects did not succeed (or invoke a popup window)
              if (this.#config.iframeLoginUI) {
                elIframe.style.display = 'block';
                elCloseBtn.style.display = 'block';
              } else {
                fnCloseIframe();
                fnOpenPopup();
              }
            }, iframeTimeout);
          } else {
            if (this.isNode) {
              // Determine port to listen to by extracting it from redirect uri
              const { redirectUri, cert, key } = this.#config;
              const isHttp = redirectUri.startsWith('http:');
              const nLocalhost = redirectUri.indexOf('localhost:');
              const nSlash = redirectUri.indexOf('/', nLocalhost + 10);
              const nPort = parseInt(redirectUri.substring(nLocalhost + 10, nSlash), 10);
              if (nLocalhost !== -1) {
                const options =
                  key && cert && !isHttp
                    ? {
                        key: this.fs.readFileSync(key),
                        cert: this.fs.readFileSync(cert)
                      }
                    : {};
                const server = (isHttp ? this.http : this.https).createServer(options, (req, res) => {
                  const { winTitle, winBodyHtml } = this.#config;
                  res.writeHead(200, { 'Content-Type': 'text/html' });
                  // Auto closing window for now.  Can always leave it up and allow authConfig props to set title and bodyHtml
                  res.end(
                    `<html><head><title>${winTitle}</title><script>window.close();</script></head><body>${winBodyHtml}</body></html>`
                  );
                  const queryString = req.url.split('?')[1];
                  const urlParams = new URLSearchParams(queryString);
                  const code = urlParams.get('code');
                  const state1 = urlParams.get('state');
                  const error = urlParams.get('error');
                  const errorDesc = urlParams.get('error_description');
                  if (error || (code && state1 === this.#dynState.state)) {
                    // Stop receiving connections and close when all are handled.
                    server.close();
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    fnGetTokenAndFinish(code, error, errorDesc);
                  }
                });
                /* eslint-enable no-undef */
                server.listen(nPort);
              }
            }
            fnOpenPopup();
          }
        };

        /* Retrieve token(s) and close login window */
        const fnGetTokenAndFinish = (code, error, errorDesc) => {
          // Can clear state in session info at this point
          delete this.#dynState.state;
          this.#updateConfig();

          if (!this.isNode) {
            fnEnableMessageReceiver(false);
            if (bWinIframe) {
              clearTimeout(tmrAuthComplete);
              fnCloseIframe();
            } else {
              clearInterval(checkWindowClosed);
              myWindow.close();
            }
          }
          if (code) {
            this.getToken(code)
              .then((token) => {
                resolve(token);
              })
              .catch((e) => {
                reject(e);
              });
          } else if (error) {
            // Handle some errors in a special manner and pass others back to client
            if (error === 'login_required') {
              // eslint-disable-next-line no-console
              console.warn('silent authentication failed...starting full authentication');
              const bSpecialDebugPath = false;
              if (bSpecialDebugPath) {
                fnSetSilentAuthFailed(false);
                bDisablePromptNone = true;
              } else {
                fnSetSilentAuthFailed(true);
                bDisablePromptNone = false;
              }
              this.#buildAuthorizeUrl(state).then((url) => {
                theUrl = url;
                doAuthorize();
              });
            } else if (error === 'invalid_session_index') {
              // eslint-disable-next-line no-console
              console.warn('auth session no longer valid...starting new session');
              // In these scenarios, not much user can do without just starting a new session, so do that
              this.#updateSessionIndex(null);
              fnSetSilentAuthFailed(false);
              this.#buildAuthorizeUrl(state).then((url) => {
                theUrl = url;
                doAuthorize();
              });
            } else {
              // eslint-disable-next-line no-console
              console.warn(`Authorize failed: ${error}. ${errorDesc}\nFailing authorize url: ${theUrl}`);
              throw new Error(error, { cause: errorDesc });
            }
          }
        };

        this.#buildAuthorizeUrl(state).then((url) => {
          theUrl = url;
          doAuthorize();
        });
      });
    }

    // Login redirect
    loginRedirect() {
      // eslint-disable-next-line no-restricted-globals
      const state = btoa(location.origin);
      this.#buildAuthorizeUrl(state).then((url) => {
          // eslint-disable-next-line no-restricted-globals
          location.href = url;
      });
    }

    // check state
    checkStateMatch(state) {
      return state === this.#dynState.state;
    }

    // Clear session index within config
    #updateSessionIndex(sessionIndex) {
      if (sessionIndex) {
        this.#dynState.sessionIndex = sessionIndex;
        this.#dynState.sessionIndexAttempts = 0;
      } else if (this.#dynState.sessionIndex) {
        delete this.#dynState.sessionIndex;
      }
      this.#updateConfig();
    }

    // For PKCE token endpoint includes code_verifier
    getToken(authCode) {
      // Reload config to pick up the previously stored codeVerifier
      this.#reloadConfig();

      const {
        serverType,
        isolationId,
        clientId,
        clientSecret,
        tokenUri,
        grantType,
        customTokenParams,
        userIdentifier,
        password,
        noPKCE
      } = this.#config;

      const {
        sessionIndex,
        acRedirectUri,
        codeVerifier
      } = this.#dynState;

      const bAuthCode = !grantType || grantType === 'authCode';
      if (bAuthCode && !authCode && !this.isNode) {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        authCode = urlParams.get('code');
      }

      const formData = new URLSearchParams();
      formData.append('client_id', clientId);
      if (clientSecret) {
        formData.append('client_secret', clientSecret);
      }
      /* eslint-disable camelcase */
      const fullGTName = {
        authCode: 'authorization_code',
        clientCreds: 'client_credentials',
        customBearer: 'custom-bearer',
        passwordCreds: 'password'
      }[grantType];
      const grant_type = fullGTName || grantType || 'authorization_code';
      formData.append('grant_type', grant_type);
      if (serverType === 'launchpad' && grantType !== 'authCode') {
        formData.append('isolation_ids', isolationId);
      }
      if (bAuthCode) {
        formData.append('code', authCode);
        formData.append('redirect_uri', acRedirectUri);
        if (!noPKCE) {
          formData.append('code_verifier', codeVerifier);
        }
      } else if (sessionIndex) {
        formData.append('session_index', sessionIndex);
      }
      /* eslint-enable camelcase */
      if (grantType === 'customBearer' && customTokenParams) {
        Object.keys(customTokenParams).forEach((param) => {
          formData.append(param, customTokenParams[param]);
        });
      }
      if (grantType !== 'authCode') {
        formData.append('enable_psyncId', 'true');
      }
      if (grantType === 'passwordCreds') {
        formData.append('username', userIdentifier);
        formData.append('password', atob(password));
      }

      return fetch(tokenUri, {
        agent: this.#getAgent(),
        method: 'POST',
        headers: new Headers({
          'content-type': this.urlencoded
        }),

        body: formData.toString()
      })
        .then((response) => response.json())
        .then((token) => {
          if (token.errors || token.error) {
            // eslint-disable-next-line no-console
            console.error(`Token endpoint error: ${JSON.stringify(token.errors || token.error)}`);
          } else {
            // .expires_in contains the # of seconds before access token expires
            // add property to keep track of current time when the token expires
            token.eA = Date.now() + token.expires_in * 1000;
            // Clear authCode related config state: state, codeVerifier, acRedirectUri
            if (this.#dynState.state) {
              delete this.#dynState.state;
            }
            if (this.#dynState.codeVerifier) {
              delete this.#dynState.codeVerifier;
            }
            if (this.#dynState.acRedirectUri) {
              delete this.#dynState.acRedirectUri;
            }
            // If there is a session_index then move this to the peConfig structure (as used on authorize)
            if (token.session_index) {
              this.#dynState.sessionIndex = token.session_index;
            }
            // If we got a token and have a session index, then reset the sessionIndexAttempts
            if (this.#dynState.sessionIndex) {
              this.#dynState.sessionIndexAttempts = 0;
            }
            this.#updateConfig();
          }
          return token;
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(`Token endpoint error: ${e}`);
        });
    }

    /* eslint-disable camelcase */
    async refreshToken(refresh_token) {
      const { clientId, clientSecret, tokenUri } = this.#config;

      if (this.isNode && !this.crypto) {
        // Deferring dynamic loading of node libraries til this first method to avoid doing this in constructor
        await this.#importNodeLibs();
      }

      if (!refresh_token) {
        return null;
      }

      const formData = new URLSearchParams();
      formData.append('client_id', clientId);
      if (clientSecret) {
        formData.append('client_secret', clientSecret);
      }
      formData.append('grant_type', 'refresh_token');
      formData.append('refresh_token', refresh_token);

      return fetch(tokenUri, {
        agent: this.#getAgent(),
        method: 'POST',
        headers: new Headers({
          'content-type': this.urlencoded
        }),

        body: formData.toString()
      })
        .then((response) => {
          if (!response.ok && response.status === 401) {
            return null;
          }
          return response.json();
        })
        .then((token) => {
          if (token) {
            // .expires_in contains the # of seconds before access token expires
            // add property to keep track of current time when the token expires
            token.eA = Date.now() + token.expires_in * 1000;
          }
          return token;
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn(`Refresh token failed: ${e}`);
          return null;
        });
    }

    async revokeTokens(access_token, refresh_token = null) {
      if (Object.keys(this.#config).length === 0) {
        // Must have a config structure to proceed
        return;
      }
      const { clientId, clientSecret, revokeUri } = this.#config;

      if (this.isNode && !this.crypto) {
        // Deferring dynamic loading of node libraries til this first method to avoid doing this in constructor
        await this.#importNodeLibs();
      }

      const hdrs = { 'content-type': this.urlencoded };
      if (clientSecret) {
        const basicCreds = btoa(`${clientId}:${clientSecret}`);
        hdrs.authorization = `Basic ${basicCreds}`;
      }
      const aTknProps = ['access_token'];
      if (refresh_token) {
        aTknProps.push('refresh_token');
      }
      aTknProps.forEach((prop) => {
        const formData = new URLSearchParams();
        if (!clientSecret) {
          formData.append('client_id', clientId);
        }
        formData.append('token', prop === 'access_token' ? access_token : refresh_token);
        formData.append('token_type_hint', prop);
        fetch(revokeUri, {
          agent: this.#getAgent(),
          method: 'POST',
          headers: new Headers(hdrs),
          body: formData.toString()
        })
          .then((response) => {
            if (!response.ok) {
              // eslint-disable-next-line no-console
              console.error(`Error revoking ${prop}:${response.status}`);
            }
          })
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error(`Error revoking ${prop}; ${e}`);
          });
      });
      this.#config.silentAuthFailed = false;
      // Also clobber any sessionIndex
      this.#updateSessionIndex(null);
    }
    /* eslint-enable camelcase */

    #sha256Hash(str) {
      // Found that the Node implementation of subtle.digest is yielding incorrect results
      //  so using a different set of apis to get expected results.
      if (this.isNode) {
        return new Promise((resolve) => {
          resolve(this.crypto.createHash('sha256').update(str).digest());
        });
      }
      return this.subtle.digest('SHA-256', new TextEncoder().encode(str));
    }

    // Base64 encode
    /* eslint-disable-next-line class-methods-use-this */
    #encode64(buff) {
      return btoa(new Uint8Array(buff).reduce((s, b) => s + String.fromCharCode(b), ''));
    }

    /*
     * Base64 url safe encoding of an array
     */
    #base64UrlSafeEncode(buf) {
      return this.#encode64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    /*
     * Get Random string starting with buffer of specified size
     */
    #getRandomString(nSize) {
      const buf = new Uint8Array(nSize);
      this.crypto.getRandomValues(buf);
      return this.#base64UrlSafeEncode(buf);
    }

    /* Calc code verifier if necessary
     */
    /* eslint-disable camelcase */
    async #getCodeChallenge(code_verifier) {
      return this.#sha256Hash(code_verifier)
        .then((hashed) => {
          return this.#base64UrlSafeEncode(hashed);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(`Error calculation code challenge for PKCE: ${error}`);
        })
        .finally(() => {
          return null;
        });
    }
    /* eslint-enable camelcase */

    /*
     * Return agent value for POST commands
     */
    #getAgent() {
      if (this.isNode && this.#config.ignoreInvalidCerts) {
        const options = { rejectUnauthorized: false };
        if (this.#config.legacyTLS) {
          options.secureOptions = this.crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT;
        }
        return new this.https.Agent(options);
      }
      return undefined;
    }
  }

  export default PegaAuth;
