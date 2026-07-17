import { createElement, useState, type PropsWithChildren } from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

import { getInstructions, getInstructionsType, getDismissBanner, mapInstructionsTypeToBannerVariant } from '../../helpers/template-utils';
import createPConnectComponent from '../../../bridge/react_pconnect';
import connectToState from '../../helpers/state-utils';

import { getKeyForMappedField, mapStateToProps } from './utils';
import type { PConnProps } from '../../../types/PConnProps';

import './DefaultForm.css';

interface DefaultFormProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  NumCols: string;
  instructions: string;
}

const Child = connectToState(mapStateToProps)(props => {
  const { key, visibility, ...rest } = props;

  return createElement(createPConnectComponent(), { ...rest, key, visibility });
});

const bannerIconMap = {
  info: <InfoOutlinedIcon fontSize='small' />,
  warning: <WarningAmberIcon fontSize='small' />,
  success: <CheckCircleOutlineIcon fontSize='small' />
};

export default function DefaultForm(props: PropsWithChildren<DefaultFormProps>) {
  const { getPConnect, NumCols = '1' } = props;
  const instructions = getInstructions(getPConnect(), props.instructions);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const instructionsType = getInstructionsType(props.instructions);
  const isBanner = typeof props.instructions === 'object' && (props.instructions as any)?.isBanner;
  const dismissBanner = getDismissBanner(props.instructions);
  const bannerVariant = mapInstructionsTypeToBannerVariant(instructionsType);

  let divClass: string;

  const numCols = NumCols || '1';
  switch (numCols) {
    case '1':
      divClass = 'psdk-default-form-one-column';
      break;
    case '2':
      divClass = 'psdk-default-form-two-column';
      break;
    case '3':
      divClass = 'psdk-default-form-three-column';
      break;
    default:
      divClass = 'psdk-default-form-one-column';
      break;
  }

  // debugger;

  // repoint the children because they are in a region and we need to not render the region
  // to take the children and create components for them, put in an array and pass as the
  // defaultForm kids
  const arChildren = getPConnect().getChildren()[0].getPConnect().getChildren();
  const dfChildren = arChildren?.map(kid => <Child key={getKeyForMappedField(kid)} {...kid} />);

  const renderInstructions = () => {
    if (!instructions || bannerDismissed) return null;

    if (isBanner) {
      return (
        <div className={`psdk-banner psdk-banner-${bannerVariant}`}>
          <div className='psdk-banner-icon'>{bannerIconMap[bannerVariant]}</div>
          <div className='psdk-banner-content' dangerouslySetInnerHTML={{ __html: instructions }} />
          {dismissBanner && (
            <button type='button' className='psdk-banner-dismiss' aria-label='Dismiss banner' onClick={() => setBannerDismissed(true)}>
              <CloseIcon fontSize='small' />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className='psdk-default-form-instruction-text'>
        {/* server performs sanitization method for instructions html content */}
        <div key='instructions' id='instruction-text' dangerouslySetInnerHTML={{ __html: instructions }} />
      </div>
    );
  };

  return (
    <>
      {renderInstructions()}
      <div className={divClass}>{dfChildren}</div>
    </>
  );
}
