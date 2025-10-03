import { createContext } from 'react';

const DataReferenceAdvancedSearchContext = createContext({
  disableStartingFieldsForReference: true,
  dataReferenceConfigToChild: {
    selectionMode: 'single',
  },
});

export default DataReferenceAdvancedSearchContext;
