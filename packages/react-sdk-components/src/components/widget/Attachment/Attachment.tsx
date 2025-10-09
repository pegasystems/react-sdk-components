import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CircularProgress, IconButton, Menu, MenuItem, Button } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { getIconFromFileType, isFileUploadedToServer, useFileDownload, validateMaxSize } from '../../helpers/attachmentHelpers';

import { Utils } from '../../helpers/utils';
import type { PConnFieldProps } from '../../../types/PConnProps';

import './Attachment.css';

interface AttachmentProps extends Omit<PConnFieldProps, 'value'> {
  // If any, enter additional props that only exist on this component
  value: any;
  allowMultiple: string;
  extensions: string;
}

const getAttachmentKey = (name, embeddedReference) => {
  return `attachmentsList${embeddedReference}.${name}`;
};

const getCurrentAttachmentsList = (key, context) => {
  return PCore.getStoreValue(`.${key}`, 'context_data', context) || [];
};

const updateAttachmentState = (pConn, key, attachments) => {
  PCore.getStateUtils().updateState(pConn.getContextName(), key, attachments, {
    pageReference: 'context_data',
    isArrayDeepMerge: false
  });
};

export default function Attachment(props: AttachmentProps) {
  const { value, getPConnect, label, validatemessage, allowMultiple, extensions, displayMode, helperText } = props;
  /* this is a temporary fix because required is supposed to be passed as a boolean and NOT as a string */
  let { required, disabled } = props;
  [required, disabled] = [required, disabled].map((prop) => prop === true || (typeof prop === 'string' && prop === 'true'));
  const pConn = getPConnect();

  const actionSequencer = useMemo(() => PCore.getActionsSequencer(), []);
  const caseID = PCore.getStoreValue('.pyID', 'caseInfo.content', pConn.getContextName());
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'CosmosFields';
  const uploadMultipleFilesLabel = localizedVal('file_upload_text_multiple', localeCategory);
  const uploadSingleFileLabel = localizedVal('file_upload_text_one', localeCategory);
  const deleteIcon = Utils.getImageSrc('trash', Utils.getSDKStaticConentUrl());
  const srcImg = Utils.getImageSrc('document-doc', Utils.getSDKStaticConentUrl());
  let valueRef = (pConn.getStateProps() as any).value;
  valueRef = valueRef.indexOf('.') === 0 ? valueRef.substring(1) : valueRef;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const rawValue = pConn.getComponentConfig().value;
  const isAttachmentAnnotationPresent = typeof rawValue === 'object' ? false : rawValue?.includes('@ATTACHMENT');
  const { hasUploadedFiles, attachments, categoryName } = isAttachmentAnnotationPresent
    ? value
    : PCore.getAttachmentUtils().prepareAttachmentData(value);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<any[]>(attachments);
  const [filesWithError, setFilesWithError] = useState<any[]>([]);
  const [toggleUploadBegin, setToggleUploadBegin] = useState(false);

  const context = pConn.getContextName();
  const onFileDownload = useFileDownload(context);

  let embeddedProperty = pConn
    .getPageReference()
    .replace(PCore.getConstants().CASE_INFO.CASE_INFO_CONTENT, '')
    .replace(PCore.getConstants().DATA_INFO.DATA_INFO_CONTENT, '');

  if (valueRef?.indexOf('.') > 0) {
    embeddedProperty = valueRef.substring(0, valueRef.indexOf('.') + 1);
  }

  const resetAttachmentStoredState = () => {
    PCore.getStateUtils().updateState(pConn.getContextName(), getAttachmentKey(valueRef, embeddedProperty), undefined, {
      pageReference: 'context_data',
      isArrayDeepMerge: false
    });
  };

  const deleteFile = useCallback(
    (file) => {
      setAnchorEl(null);

      // reset the file input so that it will allow re-uploading the same file after deletion
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset the input
      }

      let attachmentsList: any[] = [];
      let currentAttachmentList = getCurrentAttachmentsList(getAttachmentKey(valueRef, embeddedProperty), pConn.getContextName());

      // If file to be deleted is the one added in previous stage i.e. for which a file instance is created in server
      // no need to filter currentAttachmentList as we will get another entry of file in redux with delete & label
      if (hasUploadedFiles && isFileUploadedToServer(file)) {
        const updatedAttachments = files.map((f) => {
          if (f.responseProps && f.responseProps.pzInsKey === file.responseProps.pzInsKey) {
            return { ...f, delete: true, label: valueRef };
          }
          return f;
        });

        // updating the redux store to help form-handler in passing the data to delete the file from server
        updateAttachmentState(pConn, getAttachmentKey(valueRef, embeddedProperty), [...updatedAttachments]);
        setFiles((current) => {
          const newlyAddedFiles = current.filter((f) => !!f.ID);
          const filesPostDelete = current.filter((f) => isFileUploadedToServer(f) && f.responseProps?.ID !== file.responseProps?.ID);
          attachmentsList = [...filesPostDelete, ...newlyAddedFiles];
          return attachmentsList;
        });
      } //  if the file being deleted is the added in this stage  i.e. whose data is not yet created in server
      else {
        // filter newly added files in this stage, later the updated current stage files will be added to redux once files state is updated in below setFiles()
        currentAttachmentList = currentAttachmentList.filter((f) => !f.props.error && (f.delete || f.label !== valueRef));
        setFiles((current) => current.filter((f) => f.ID !== file.ID));
        updateAttachmentState(pConn, getAttachmentKey(valueRef, embeddedProperty), [...currentAttachmentList, ...attachmentsList]);
        if (file.inProgress) {
          // @ts-expect-error - 3rd parameter "responseEncoding" should be optional
          PCore.getAttachmentUtils().cancelRequest(file.ID, pConn.getContextName());
          actionSequencer.deRegisterBlockingAction(pConn.getContextName()).catch((error) => {
            console.log(error);
          });
        }
      }

      setToggleUploadBegin(false);
      setFilesWithError((prevFilesWithError) => {
        return prevFilesWithError.filter((f) => f.ID !== file.ID);
      });
    },
    [valueRef, pConn, hasUploadedFiles, filesWithError, hasUploadedFiles, actionSequencer]
  );

  const onUploadProgress = () => {};

  const errorHandler = (isFetchCanceled, attachedFile) => {
    return (error) => {
      if (!isFetchCanceled(error)) {
        let uploadFailMsg = pConn.getLocalizedValue('Something went wrong', '', '');
        if (error.response && error.response.data && error.response.data.errorDetails) {
          uploadFailMsg = pConn.getLocalizedValue(error.response.data.errorDetails[0].localizedValue, '', '');
        }
        setFiles((current) => {
          return current.map((f) => {
            if (f.ID === attachedFile.ID) {
              f.props.meta = uploadFailMsg;
              f.props.error = true;
              f.props.onDelete = () => deleteFile(f);
              f.props.icon = getIconFromFileType(f.type);
              f.props.name = pConn.getLocalizedValue('Unable to upload file', '', '');
              f.inProgress = false;
              const fieldName = (pConn.getStateProps() as any).value;
              // set errors to property to block submit even on errors in file upload
              PCore.getMessageManager().addMessages({
                messages: [
                  {
                    type: 'error',
                    message: pConn.getLocalizedValue('Error with one or more files', '', '')
                  }
                ],
                property: fieldName,
                pageReference: pConn.getPageReference(),
                context
              });
              delete f.props.progress;
            }
            return f;
          });
        });
      }
      throw error;
    };
  };

  const validateFileExtension = (fileObj, allowedExtensions) => {
    if (!allowedExtensions) {
      return true;
    }
    const allowedExtensionList = allowedExtensions
      .toLowerCase()
      .split(',')
      .map((item) => item.replaceAll('.', '').trim());
    const extension = fileObj.name.split('.').pop().toLowerCase();
    return allowedExtensionList.includes(extension);
  };

  const clearFieldErrorMessages = () => {
    const fieldName = (pConn.getStateProps() as any).value;
    PCore.getMessageManager().clearMessages({
      type: PCore.getConstants().MESSAGES.MESSAGES_TYPE_ERROR,
      property: fieldName,
      pageReference: pConn.getPageReference(),
      context
    });
  };

  const onFileAdded = (event) => {
    let addedFiles = Array.from(event.target.files);
    addedFiles = allowMultiple === 'true' ? addedFiles : [addedFiles[0]];
    const maxAttachmentSize = PCore.getEnvironmentInfo().getMaxAttachmentSize() || '5';
    const tempFilesToBeUploaded = [
      ...addedFiles.map((f: any, index) => {
        f.ID = `${new Date().getTime()}I${index}`;
        f.inProgress = true;
        f.props = {
          type: f.type,
          name: f.name,
          icon: getIconFromFileType(f.type),
          onDelete: () => deleteFile(f)
        };
        if (!validateMaxSize(f, maxAttachmentSize)) {
          f.props.error = true;
          f.inProgress = false;
          f.props.meta = pConn.getLocalizedValue(`File is too big. Max allowed size is ${maxAttachmentSize}MB.`, '', '');
        } else if (!validateFileExtension(f, extensions)) {
          f.props.error = true;
          f.inProgress = false;
          f.props.meta = `${pConn.getLocalizedValue('File has invalid extension. Allowed extensions are:', '', '')} ${extensions.replaceAll(
            '.',
            ''
          )}`;
        }
        if (f.props.error) {
          const fieldName = (pConn.getStateProps() as any).value;
          PCore.getMessageManager().addMessages({
            messages: [
              {
                type: 'error',
                message: pConn.getLocalizedValue('Error with one or more files', '', '')
              }
            ],
            property: fieldName,
            pageReference: pConn.getPageReference(),
            context
          });
        }
        return f;
      })
    ];
    const tempFilesWithError = tempFilesToBeUploaded.filter((f) => f.props.error);
    if (tempFilesWithError.length > 0) {
      setFilesWithError(tempFilesWithError);
    }
    setFiles((current) => (allowMultiple !== 'true' ? [...tempFilesToBeUploaded] : [...current, ...tempFilesToBeUploaded]));
    setToggleUploadBegin(true);
  };

  const uploadFiles = useCallback(() => {
    const filesToBeUploaded = files
      .filter((e) => {
        const isFileUploaded = e.props && e.props.progress === 100;
        const fileHasError = e.props && e.props.error;
        const isFileUploadedinLastStep = e.responseProps && e.responseProps.pzInsKey;
        return !isFileUploaded && !fileHasError && !isFileUploadedinLastStep;
      })
      .map((f) =>
        window.PCore.getAttachmentUtils().uploadAttachment(
          f,
          () => {
            onUploadProgress();
          },
          (isFetchCanceled) => {
            return errorHandler(isFetchCanceled, f);
          },
          pConn.getContextName()
        )
      );
    Promise.allSettled(filesToBeUploaded)
      .then((fileResponses: any) => {
        fileResponses = fileResponses.filter((fr) => fr.status !== 'rejected'); // in case of deleting an in progress file, promise gets cancelled but still enters then block
        if (fileResponses.length > 0) {
          setFiles((current) => {
            const tempFilesUploaded = [...current];
            tempFilesUploaded.forEach((f) => {
              const index = fileResponses.findIndex((fr: any) => fr.value.clientFileID === f.ID);
              if (index >= 0) {
                f.props.meta = pConn.getLocalizedValue('Uploaded successfully', '', '');
                f.props.progress = 100;
                f.inProgress = false;
                f.handle = fileResponses[index].value.ID;
                f.label = valueRef;
                f.category = categoryName;
                f.responseProps = {
                  pzInsKey: 'temp',
                  pyAttachName: f.props.name
                };
              }
            });
            return tempFilesUploaded;
          });

          if (filesWithError.length === 0) {
            clearFieldErrorMessages();
          }
        }
        setToggleUploadBegin(false);
      })
      .catch((error) => {
        console.log(error);
        setToggleUploadBegin(false);
      });
  }, [files, filesWithError]);

  useEffect(() => {
    if (toggleUploadBegin && files.length > 0) {
      uploadFiles();
    }
  }, [toggleUploadBegin]);

  useEffect(() => {
    if (files.length > 0 && displayMode !== 'DISPLAY_ONLY') {
      const currentAttachmentList = getCurrentAttachmentsList(getAttachmentKey(valueRef, embeddedProperty), pConn.getContextName());
      // block duplicate files to redux store when added 1 after another to prevent multiple duplicates being added to the case on submit
      const tempFiles = files.filter((f) => currentAttachmentList.findIndex((fr) => fr.ID === f.ID) === -1 && !f.inProgress && f.responseProps);

      const updatedAttList = [...currentAttachmentList, ...tempFiles];
      updateAttachmentState(pConn, getAttachmentKey(valueRef, embeddedProperty), updatedAttList);
    }
  }, [files]);

  useEffect(() => {
    if (filesWithError.length === 0) {
      clearFieldErrorMessages();
    }
  }, [filesWithError]);

  useEffect(() => {
    let tempUploadedFiles = getCurrentAttachmentsList(getAttachmentKey(valueRef, embeddedProperty), pConn.getContextName());
    tempUploadedFiles = tempUploadedFiles.filter((f) => f.label === valueRef);
    setFiles((current) => {
      return [
        ...current.map((f) => {
          return f.responseProps.pzInsKey && !f.responseProps.pzInsKey.includes('temp')
            ? {
                ...f,
                props: {
                  ...f.props,
                  onDelete: () => deleteFile(f)
                }
              }
            : { ...f };
        }),
        ...tempUploadedFiles
      ];
    });
    if (displayMode !== 'DISPLAY_ONLY') {
      PCore.getPubSubUtils().subscribe(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION, resetAttachmentStoredState, caseID);
    }
    return () => {
      if (displayMode !== 'DISPLAY_ONLY') {
        PCore.getPubSubUtils().unsubscribe(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION, caseID);
      }
    };
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const content = (
    <div style={{ marginBottom: '8px' }}>
      <div className={`${disabled ? 'file-disabled' : ''} ${validatemessage === '' ? 'file-div' : 'file-div-error'}`}>
        <div hidden={true} id='attachment-ID'>
          {valueRef}
        </div>
        <label htmlFor={valueRef}>
          <input
            style={{ display: 'none' }}
            id={valueRef}
            name='upload-photo'
            type='file'
            multiple={allowMultiple === 'true'}
            required={required}
            disabled={disabled}
            onChange={onFileAdded}
          />
          <Button style={{ textTransform: 'none' }} variant='outlined' color='primary' component='span'>
            {allowMultiple === 'true'
              ? uploadMultipleFilesLabel === 'file_upload_text_multiple'
                ? 'Choose files'
                : uploadMultipleFilesLabel
              : uploadSingleFileLabel === 'file_upload_text_one'
                ? 'Choose a file'
                : uploadSingleFileLabel}
          </Button>
        </label>
      </div>
    </div>
  );

  const fileDisplay = (
    <div>
      {files &&
        files.length > 0 &&
        files.map((item, index) => {
          return (
            <div key={index} className='psdk-utility-card'>
              <div className='psdk-utility-card-icon'>
                {!item.inProgress && <img className='psdk-utility-card-svg-icon' src={srcImg} />}
                {item.inProgress && (
                  <div>
                    <CircularProgress />
                  </div>
                )}
              </div>
              <div className='psdk-utility-card-main'>
                <div className='psdk-utility-card-main-primary-label'>{item.props.name}</div>
                {item.props.meta && <div style={{ color: item.props.error ? 'red' : undefined }}>{item.props.meta}</div>}
              </div>
              <div className='psdk-utility-action'>
                {item.ID && (
                  <button type='button' className='psdk-utility-button' aria-label='Delete Attachment' onClick={() => deleteFile(item)}>
                    <img className='psdk-utility-card-action-svg-icon' src={deleteIcon} />
                  </button>
                )}
                {!item.ID && (
                  <div>
                    <IconButton
                      id='setting-button'
                      aria-controls={open ? 'file-menu' : undefined}
                      aria-expanded={open ? 'true' : undefined}
                      aria-haspopup='true'
                      onClick={handleClick}
                      size='large'
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu style={{ marginTop: '3rem' }} id='file-menu' anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
                      <MenuItem
                        style={{ fontSize: '14px' }}
                        key='download'
                        onClick={() => {
                          setAnchorEl(null);
                          onFileDownload(item.responseProps ? item.responseProps : {});
                        }}
                      >
                        Download
                      </MenuItem>
                      <MenuItem style={{ fontSize: '14px' }} key='delete' onClick={() => deleteFile(item)}>
                        Delete
                      </MenuItem>
                    </Menu>
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );

  return (
    <div className='file-upload-container'>
      <span className={`label ${required ? 'file-label' : ''}`}>{label}</span>
      {((files.length === 0 && allowMultiple !== 'true') || allowMultiple === 'true') && <section>{content}</section>}
      {validatemessage !== '' ? <span className='file-error'>{validatemessage}</span> : <span style={{ fontSize: '14px' }}>{helperText}</span>}
      {files && files.length > 0 && <section>{fileDisplay}</section>}
    </div>
  );
}
