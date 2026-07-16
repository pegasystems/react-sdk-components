import { createElement, useState, type PropsWithChildren } from 'react';

import { getInstructions } from '../../helpers/template-utils';
import createPConnectComponent from '../../../bridge/react_pconnect';
import connectToState from '../../helpers/state-utils';

import { getKeyForMappedField, mapStateToProps } from './utils';
import type { PConnProps } from '../../../types/PConnProps';

import './DefaultForm.css';

interface InstructionsObj {
  htmlContent?: string;
  isBanner?: boolean;
  dismissBanner?: boolean;
  /** Message type sent by Pega core when a Rule-UI-Paragraph is configured as a banner */
  messageType?: 'Information' | 'Warning' | 'Error' | 'Success';
}

interface DefaultFormProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  NumCols: string;
  instructions: string | InstructionsObj;
}

const Child = connectToState(mapStateToProps)(props => {
  const { key, visibility, ...rest } = props;

  return createElement(createPConnectComponent(), { ...rest, key, visibility });
});

function getBannerClass(messageType?: InstructionsObj['messageType']) {
  switch (messageType) {
    case 'Warning':
      return 'psdk-banner-warning';
    case 'Error':
      return 'psdk-banner-error';
    case 'Success':
      return 'psdk-banner-success';
    case 'Information':
    default:
      return 'psdk-banner-info';
  }
}

function BannerIcon({ messageType }: { messageType?: InstructionsObj['messageType'] }) {
  switch (messageType) {
    case 'Warning':
      return (
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z' />
        </svg>
      );
    case 'Error':
      return (
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
        </svg>
      );
    case 'Success':
      return (
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z' />
        </svg>
      );
    case 'Information':
    default:
      return (
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' />
        </svg>
      );
  }
}

export default function DefaultForm(props: PropsWithChildren<DefaultFormProps>) {
  const { getPConnect, NumCols = '1' } = props;
  // When instructions is an object (banner), extract htmlContent directly.
  // When it is a string token ('casestep', 'none', or paragraph html), delegate to the helper.
  const instructions =
    typeof props.instructions === 'object'
      ? props.instructions?.htmlContent
      : getInstructions(getPConnect(), props.instructions);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Extract banner-related properties from the raw instructions prop
  const rawInstructions: InstructionsObj | undefined =
    typeof props.instructions === 'object' && props.instructions !== null ? props.instructions : undefined;
  const isBanner = rawInstructions?.isBanner ?? false;
  const dismissBanner = rawInstructions?.dismissBanner ?? false;
  const messageType = rawInstructions?.messageType;

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
        <div className={`psdk-banner ${getBannerClass(messageType)}`}>
          <div className='psdk-banner-icon'>
            <BannerIcon messageType={messageType} />
          </div>
          <div className='psdk-banner-content' dangerouslySetInnerHTML={{ __html: instructions }} />
          {dismissBanner && (
            <button type='button' className='psdk-banner-dismiss' aria-label='Dismiss banner' onClick={() => setBannerDismissed(true)}>
              <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
              </svg>
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

