import React, { useCallback, useMemo, useState, createElement } from 'react';
import Button from '@mui/material/Button';

import createPConnectComponent from '../../../bridge/react_pconnect';
import { isEmptyObject } from '../../helpers/common-utils';
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import './PromotedFilters.css';

import type { PConnProps } from '../../../types/PConnProps';

// Can't use PromotedFilterProps until getContainerManager() knows about addTransientItem
//  Currently just expects "object"
interface PromotedFilterProps extends PConnProps {
  // If any, enter additional props that only exist on this component
  viewName: string;
  filters: any[];
  listViewProps: any;
  pageClass: string;
  parameters?: object;
}

const localeCategory = 'SimpleTable';
const SUPPORTED_TYPES_IN_PROMOTED_FILTERS = [
  'TextInput',
  'Percentage',
  'Email',
  'Integer',
  'Decimal',
  'Checkbox',
  'DateTime',
  'Date',
  'Time',
  'Text',
  'TextArea',
  'Currency',
  'URL',
  'RichText'
];

function Filters({ filters, transientItemID, localeReference }) {
  return filters.map((filter, index) => {
    const filterClone = { ...filter };
    // convert any field which is not supported to TextInput and delete the placeholder as it may contain placeholder specific to original type.
    if (!SUPPORTED_TYPES_IN_PROMOTED_FILTERS.includes(filterClone.type)) {
      filterClone.type = 'TextInput';
      delete filterClone.config.placeholder;
    }
    filterClone.config.contextName = transientItemID;
    filterClone.config.readOnly = false;
    filterClone.config.context = transientItemID;
    filterClone.config.localeReference = localeReference;
    const c11nEnv = PCore.createPConnect({
      meta: filterClone,
      options: {
        hasForm: true,
        contextName: transientItemID
      }
    });

    return <React.Fragment key={index}>{createElement(createPConnectComponent(), c11nEnv)}</React.Fragment>;
  });
}

function isValidInput(input) {
  return Object.values(input).findIndex((v) => v) >= 0;
}

export default function PromotedFilters(props: PromotedFilterProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const ListView = getComponentFromMap('ListView');

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const { getPConnect, viewName, filters, listViewProps, pageClass, parameters } = props;
  const [initTable, setInitTable] = useState(false);
  const [payload, setPayload] = useState({});
  const filtersProperties = {};

  filters.forEach((filter) => {
    filtersProperties[PCore.getAnnotationUtils().getPropertyName(filter.config.value)] = '';
  });

  const transientItemID = useMemo(() => {
    const filtersWithClassID = {
      ...filtersProperties,
      classID: pageClass
    };
    return getPConnect().getContainerManager().addTransientItem({
      id: viewName,
      data: filtersWithClassID
    });
  }, []);

  function formatPromotedFilters(promotedFilters) {
    return Object.entries(promotedFilters).reduce((acc, [field, value]) => {
      if (value) {
        acc[field] = {
          lhs: {
            field
          },
          comparator: 'EQ',
          rhs: {
            value
          }
        };
      }
      return acc;
    }, {});
  }

  const getFilterData = useCallback(
    (e) => {
      e.preventDefault(); // to prevent un-intended forms submission.

      const changes = PCore.getFormUtils().getChanges(transientItemID);
      const formValues = {};
      Object.keys(changes).forEach((key) => {
        if (!['context_data', 'pageInstructions'].includes(key)) {
          formValues[key] = changes[key];
        }
      });
      const promotedFilters = formatPromotedFilters(formValues);
      if (PCore.getFormUtils().isFormValid(transientItemID) && isValidInput(formValues)) {
        setInitTable(true);
        const Query: any = {
          dataViewParameters: parameters
        };

        if (!isEmptyObject(promotedFilters)) {
          Query.query = { filter: { filterConditions: promotedFilters } };
        }
        setPayload(Query);
      }
    },
    [transientItemID]
  );

  const clearFilterData = useCallback(() => {
    PCore.getContainerUtils().clearTransientData(transientItemID);
    setInitTable(false);
    getPConnect()?.getListActions?.()?.setSelectedRows([]); // Clear the selection (if any made by user)
  }, [transientItemID]);

  return (
    <>
      <div>{listViewProps.title}</div>
      <div className='psdk-grid-filter'>
        <Filters filters={filters} transientItemID={transientItemID} localeReference={listViewProps.localeReference} />
      </div>
      <div>
        <Button key='1' type='button' onClick={clearFilterData} data-testid='clear' variant='contained' color='primary'>
          {localizedVal('Clear', localeCategory)}
        </Button>
        <Button style={{ float: 'right' }} key='2' type='submit' onClick={getFilterData} data-testid='search' variant='contained' color='primary'>
          {localizedVal('Search', localeCategory)}
        </Button>
      </div>
      {initTable && (
        <ListView
          {...listViewProps}
          title=''
          payload={payload}
          isSearchable
          tableDisplay={{
            show: initTable
          }}
        />
      )}
    </>
  );
}
