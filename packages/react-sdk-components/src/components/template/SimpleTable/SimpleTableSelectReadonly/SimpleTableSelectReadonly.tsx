import { createElement, Fragment, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { getComponentFromMap } from '../../../../bridge/helpers/sdk_component_map';
import createPConnectComponent from '../../../../bridge/react_pconnect';
import { Utils } from '../../../helpers/utils';
import { SIMPLE_TABLE_MANUAL_READONLY } from '../../../field/ObjectReference/utils';
import type { PConnProps } from '../../../../types/PConnProps';

interface SimpleTableSelectReadonlyProps extends PConnProps {
  label?: string;
  referenceList: object[] | string;
  readonlyContextList?: object[];
  primaryField?: string;
  referenceType?: string;
  selectionKey?: string;
  selectionList?: string;
  hideLabel?: boolean;
  variant?: string;
  displayAs?: string;
  displayMode?: string;
}

export default function SimpleTableSelectReadonly(props: SimpleTableSelectReadonlyProps) {
  const {
    label = '',
    getPConnect,
    readonlyContextList = [],
    primaryField = '',
    referenceType = '',
    selectionKey = '',
    selectionList = '',
    hideLabel = false,
    displayAs = 'readonly',
    displayMode
  } = props;

  const [modalOpen, setModalOpen] = useState(false);

  const { DATA, CASE } = PCore.getConstants().RESOURCE_TYPES;
  const pConn = getPConnect();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'SimpleTableSelectReadOnly';
  const PComponent = createPConnectComponent();

  const openModal = () => {
    const rawConfig = (getPConnect().getRawMetadata() as any).config;
    const rawFields = rawConfig?.presets?.[0].children?.[0]?.children || [];

    const caseFields = rawFields
      .filter((field: any) => field.config.value.includes(`@P .${Utils.getMappedKey('pyID')}`) || field.config.value.includes(`@P ${primaryField}`))
      .map((field: any) => field.config.value);

    const dataFields = rawFields.filter((field: any) => field.config.value.includes(`@P ${primaryField}`)).map((field: any) => field.config.value);

    const defaultFields: any[] = rawConfig?.detailsDisplay || [];
    if (defaultFields?.length === 2 && defaultFields[0].config.value === defaultFields[1].config.value) {
      defaultFields.splice(0, 1);
    }
    defaultFields.forEach((field: any) => {
      if (
        (referenceType.toUpperCase() === CASE && !caseFields.includes(field?.config?.value)) ||
        (referenceType.toUpperCase() === DATA && !dataFields.includes(field?.config?.value))
      ) {
        (getPConnect().getRawMetadata() as any).config?.presets?.[0].children?.[0]?.children?.unshift(field);
      }
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const renderModal = () => {
    const SimpleTableManual = getComponentFromMap('SimpleTableManual');

    let readonlyContextObject: { referenceList?: object[] } | undefined;
    if (typeof props.referenceList === 'string') {
      readonlyContextObject = { referenceList: readonlyContextList };
    }

    return (
      <Dialog open={modalOpen} onClose={closeModal} maxWidth='md' fullWidth>
        <DialogTitle>{label}</DialogTitle>
        <DialogContent>
          <SimpleTableManual {...props} {...readonlyContextObject} classId={SIMPLE_TABLE_MANUAL_READONLY} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} variant='contained'>
            {localizedVal('Close', localeCategory)}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  let displayComp: any;

  if (readonlyContextList && readonlyContextList.length > 0) {
    const listLength = readonlyContextList.length;
    const filteredList = ['combobox', 'checkboxgroup'].includes(displayAs) ? readonlyContextList : readonlyContextList.slice(0, 5);

    displayComp = (
      <div>
        {filteredList.map((child: any, index: number) => {
          const selectionKeyProp = selectionKey.substring(1);
          const primaryFieldProp = primaryField?.substring(1);
          const selectionListProp = selectionList?.substring(1);
          const referenceLabel = child[primaryFieldProp] || '';

          let resourcePayload = {};
          let resourceParams = {};
          let previewKey = '';

          if (referenceType.toUpperCase() === CASE) {
            previewKey = child[Utils.getMappedKey('pzInsKey')];
            resourcePayload = { caseClassName: child.classID };
            resourceParams = { workID: child[selectionKeyProp] };
          }

          const metadata = {
            type: 'SemanticLink',
            config: {
              text: referenceLabel,
              resourceParams,
              resourcePayload,
              previewKey,
              referenceType
            }
          };

          const childPConnectConfig = PCore.createPConnect({
            meta: metadata,
            options: {
              context: pConn.getContextName(),
              pageReference: `${pConn.getPageReference()}.${selectionListProp}[${index}]`
            }
          });

          return (
            <Fragment key={child[selectionKeyProp]}>
              {createElement(PComponent, { ...childPConnectConfig })}
              {index + 1 !== filteredList.length && ', '}
            </Fragment>
          );
        })}
        {listLength > 5 && !['combobox', 'checkboxgroup'].includes(displayAs) && (
          <Link component='button' onClick={openModal} underline='hover'>
            ({listLength} {localizedVal('Total', localeCategory)})
          </Link>
        )}
      </div>
    );
  }

  if (displayMode === 'DISPLAY_ONLY') {
    return displayComp ?? <Typography variant='body2'>---</Typography>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '0.5rem' }}>
      {!hideLabel && label && (
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
      )}
      {displayComp}
      {renderModal()}
    </div>
  );
}
