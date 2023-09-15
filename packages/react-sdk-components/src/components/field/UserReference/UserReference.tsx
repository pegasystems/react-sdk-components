import React, { Fragment, memo, useEffect, useState } from 'react';
import { Typography } from '@material-ui/core';
import AutoComplete from '../AutoComplete';
import Dropdown from '../Dropdown';
import { getUserId, isUserNameAvailable } from './UserReferenceUtils';
import type { PConnProps } from '../../../types/PConnProps';

// Remove this and use "real" PCore type once .d.ts is fixed (currently shows 1 errors)
declare const PCore: any;

const DROPDOWN_LIST = 'Drop-down list';
const SEARCH_BOX = 'Search box';


interface UserReferenceProps extends PConnProps {
  // If any, enter additional props that only exist on URLComponent here
  displayAs?: string,
  label?: string,
  value?: any,
  testId?: string,
  placeholder?: string,
  helperText?: string,
  disabled?: boolean | string,
  readOnly?: boolean | string,
  required?: boolean | string,
  validatemessage?: string,
  showAsFormattedText?: boolean,
  additionalProps?: object,
  hideLabel?: boolean,
  variant?: string

}


const UserReference = (props: UserReferenceProps) => {
  const {
    label = null,
    displayAs = null,
    getPConnect,
    value = null,
    testId = null,
    helperText=null,
    validatemessage = null,
    placeholder = null,
    showAsFormattedText = false,
    additionalProps = {},
    hideLabel = false,
    readOnly = false,
    required = false,
    disabled = false,
    onChange,
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    variant = 'inline'
  } = props;
  const [dropDownDataSource, setDropDownDataSource] = useState([]);
  const [userName, setUserName] = useState('');
  const OPERATORS_DP = PCore.getEnvironmentInfo().getDefaultOperatorDP();
  const userId = getUserId(value);

  useEffect(() => {
    if (userId && readOnly && showAsFormattedText) {
      if (isUserNameAvailable(value)) {
        setUserName(value.userName);
      } else {
        // if same user ref field is referred in view as editable & readonly formatted text
        // referenced users won't be available, so get user details from dx api
        const { getOperatorDetails } = PCore.getUserApi();
        getOperatorDetails(userId).then(res => {
          if (res.data && res.data.pyOperatorInfo && res.data.pyOperatorInfo.pyUserName) {
            setUserName(res.data.pyOperatorInfo.pyUserName);
          }
        });
      }
    } else if (displayAs === DROPDOWN_LIST) {
      const queryPayload = {
        dataViewName: OPERATORS_DP
      };
      PCore.getRestClient()
        .invokeRestApi('getListData', { queryPayload })
        .then(res => {
          const ddDataSource = res.data.data.map(listItem => ({
            key: listItem.pyUserIdentifier,
            value: listItem.pyUserName
          }));
          setDropDownDataSource(ddDataSource);
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.error(err);
        });
    }
  }, [displayAs, readOnly, showAsFormattedText, value]);

  let userReferenceComponent: any = null;

  if (readOnly && showAsFormattedText) {
    if (userId) {
      userReferenceComponent = (
        <Fragment>
          {/*
            TODO: This has to be replaced with Operator Component
          */}
          <div>
            <Typography variant='caption'>{label}</Typography>
            <Typography variant='body1'>{userName}</Typography>
          </div>
        </Fragment>
      );
    }
  } else {
    if (displayAs === SEARCH_BOX) {
      const columns = [
        {
          value: 'pyUserName',
          display: 'true',
          useForSearch: true,
          primary: 'true'
        },
        {
          value: 'pyUserIdentifier',
          setProperty: 'Associated property',
          key: 'true',
          display: 'true',
          secondary: 'true',
          useForSearch: 'true'
        }
      ];

      userReferenceComponent = (
        <AutoComplete
          additionalProps={additionalProps}
          label={label}
          getPConnect={getPConnect}
          datasource={OPERATORS_DP}
          listType='datapage'
          columns={columns}
          testId={testId}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          required={required}
          helperText={helperText}
          validatemessage={validatemessage}
          value={userId}
          hideLabel={hideLabel}
          onChange={onChange}
        />
      );
    }
    if (displayAs === DROPDOWN_LIST) {
      userReferenceComponent = (
        <Dropdown
          additionalProps={additionalProps}
          datasource={dropDownDataSource}
          listType='associated'
          getPConnect={getPConnect}
          label={label}
          value={userId}
          testId={testId}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          required={required}
          helperText={helperText}
          validatemessage={validatemessage}
          hideLabel={hideLabel}
          onChange={onChange}
        />
      );
    }
  }

  return userReferenceComponent;
};


// as objects are there in props, shallow comparision fails & re-rendering of comp happens even with
// same key value pairs in obj. hence using custom comparison function on when to re-render
const comparisonFn = (prevProps, nextProps) => {
  return (
    getUserId(prevProps.value) === getUserId(nextProps.value) &&
    prevProps.validatemessage === nextProps.validatemessage &&
    prevProps.required === nextProps.required &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.readOnly === nextProps.readOnly
  );
};

export default memo(UserReference, comparisonFn);
