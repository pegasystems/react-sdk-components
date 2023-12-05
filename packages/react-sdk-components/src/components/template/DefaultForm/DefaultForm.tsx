import React, { createElement } from 'react';
import { getInstructions } from '../../helpers/template-utils';
import createPConnectComponent from '../../../bridge/react_pconnect';
import connectToState from '../../helpers/state-utils';
import { getKeyForMappedField, mapStateToProps } from './utils';
// import type { PConnProps } from '../../../types/PConnProps';


import './DefaultForm.css';


// Can't use PConn props until proper props for getPConnect().getChildren()[0].getPConnect;
// interface DefaultFormProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
//   children: Array<any>,
//   NumCols: string

// }


const Child = connectToState(mapStateToProps)(props => {
  const { key, visibility, ...rest } = props;

  return createElement(createPConnectComponent(), { ...rest, key, visibility });
});

export default function DefaultForm(props /* : DefaultFormProps */) {
  const { getPConnect, NumCols = '1' } = props;
  const instructions = getInstructions(getPConnect(), props.instructions);

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

  return (
    <>
      {instructions && (
        <div className='psdk-default-form-instruction-text'>
          {/* server performs sanitization method for instructions html content */}
          { /* eslint-disable react/no-danger */ }
          <div key="instructions" id="instruction-text" dangerouslySetInnerHTML={{ __html: instructions }} />
        </div>
      )}
      <div className={divClass}>{dfChildren}</div>
    </>
  );
}
