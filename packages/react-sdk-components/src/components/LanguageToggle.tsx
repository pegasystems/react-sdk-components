import { MenuItem, TextField } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const LanguageToggle = () => {
  // const lang = sessionStorage.getItem('rsdk_locale')?.substring(0, 2) || 'en';
  // const [selectedLang, setSelectedLang] = useState(lang);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [resourcebundles, setResourceBundles] = useState([]);

  const changeLanguage = async e => {
    e.preventDefault();
    const val = e.target.value;
    // setSelectedLang(lang);
    sessionStorage.setItem('rsdk_locale', val);

    if (typeof PCore !== 'undefined') {
      // Fetch Locale Reference names for data pages
      // const datapageKeys = Object.keys((PCore.getDataPageUtils() as any).dataStore);
      // const dataPageBundleNames = datapageKeys.map(dpageName => {
      //   return `@BASECLASS!DATAPAGE!${dpageName.toUpperCase()}`;
      // });

      // @ts-ignore
      const { GENERIC_BUNDLE_KEY, FIELD_LABELS_BUNDLE_KEY, MESSAGE_BUNDLE_KEY } = PCore.getLocaleUtils();

      const bundles = [GENERIC_BUNDLE_KEY, FIELD_LABELS_BUNDLE_KEY, MESSAGE_BUNDLE_KEY];

      // bundles.push(...resourcebundles, ...dataPageBundleNames);
      PCore.getEnvironmentInfo().setLocale(val);
      PCore.getLocaleUtils().resetLocaleStore();
      await PCore.getLocaleUtils().loadLocaleResources(bundles);

      PCore.getPubSubUtils().publish('languageToggleTriggered', { language: val, localeRef: [] });
    }
  };

  // Initialises language value in session storage, and for dayjs
  useEffect(() => {
    // document.addEventListener('SdkConstellationReady', () => {
    //   PCore.onPCoreReady(() => {
    //     // @ts-ignore
    //     PCore.getPubSubUtils().subscribe(PCore.getConstants().PUB_SUB_EVENTS.EVENT_EXPRESS_LOCALACTION, data => {
    //       setResourceBundles(data.submitResponse.uiResources.localeReferences);
    //     });
    //   });
    // });

    if (!sessionStorage.getItem('rsdk_locale')) {
      sessionStorage.setItem('rsdk_locale', `en_GB`);
      dayjs.locale('en');
    } else {
      const currentLang = sessionStorage.getItem('rsdk_locale')?.slice(0, 2).toLowerCase();
      dayjs.locale(currentLang);
    }
  }, []);

  return (
    <TextField fullWidth variant='outlined' size='small' onChange={changeLanguage} label='Select Language' select>
      <MenuItem value='en-US'>English</MenuItem>
      <MenuItem value='fr-CA'>French</MenuItem>
      <MenuItem value='es-XL'>Spanish</MenuItem>
    </TextField>
  );
};

export default LanguageToggle;
