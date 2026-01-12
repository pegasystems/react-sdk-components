import { MenuItem, TextField } from '@mui/material';
import { usePega } from '../samples/Embedded/context/PegaReadyContext';

const LanguageToggle = () => {
  const { language, setLanguage } = usePega();

  const changeLanguage = async e => {
    e.preventDefault();

    const val = e.target.value;

    PCore.getEnvironmentInfo().setLocale(val);

    setLanguage(val);
  };

  return (
    <TextField fullWidth variant='outlined' size='small' value={language} onChange={changeLanguage} label='Select Language' select>
      <MenuItem value='en-US'>English</MenuItem>
      <MenuItem value='fr-CA'>French</MenuItem>
      <MenuItem value='th-TH'>Thai</MenuItem>
    </TextField>
  );
};

export default LanguageToggle;
