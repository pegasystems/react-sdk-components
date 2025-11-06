import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CircularProgress, IconButton, Menu, MenuItem, Button } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import { Utils } from '../../helpers/utils';
import {
  clearFieldErrorMessages,
  deleteAttachments,
  getIconFromFileType,
  getMappedValue,
  insertAttachments,
  useDeepMemo,
  useFileDownload,
  validateFileExtension,
  validateMaxSize
} from './AttachmentUtils';
import type { PageInstructionOptions } from './Attachment.types';
import type { PConnFieldProps } from '../../../types/PConnProps';

import './Attachment.css';

interface AttachmentProps extends Omit<PConnFieldProps, 'value'> {
  // If any, enter additional props that only exist on this component
  value: any;
  allowMultiple: boolean | string;
  extensions: string;
  editMode: string;
  isTableFormatter: boolean;
}

export default function Attachment(props: AttachmentProps) {
  const { value, getPConnect, label, validatemessage, extensions, displayMode, helperText, editMode, isTableFormatter } = props;
  /* this is a temporary fix because required is supposed to be passed as a boolean and NOT as a string */
  let { required, disabled, allowMultiple } = props;
  [required, disabled, allowMultiple] = [required, disabled, allowMultiple].map(
    prop => prop === true || (typeof prop === 'string' && prop === 'true')
  );
  const pConn = getPConnect();
  const localizationService = pConn.getLocalizationService();

  const actionSequencer = useMemo(() => PCore.getActionsSequencer(), []);
  const rawValue = pConn.getComponentConfig().value;
  const isAttachmentAnnotationPresent = typeof rawValue === 'object' ? false : rawValue?.includes('@ATTACHMENT');
  const { attachments, isOldAttachment } = isAttachmentAnnotationPresent ? value : PCore.getAttachmentUtils().prepareAttachmentData(value);

  let valueRef = (pConn.getStateProps() as any).value;
  valueRef = valueRef.indexOf('.') === 0 ? valueRef.substring(1) : valueRef;

  pConn.setReferenceList(`.${valueRef}`);

  const isMultiAttachmentInInlineEditTable = isTableFormatter && allowMultiple && editMode === 'tableRows';

  const [files, setFiles] = useState<any[]>(attachments);
  const overrideLocalState = useRef(false);
  const attachmentCount = useRef(attachments.length);
  const filesWithError = useRef<any[]>([]);
  const multiAttachmentsInInlineEdit = useRef([]);
  const thumbnailURLs = useRef<any[]>([]);
  const contextName = pConn.getContextName();
  const onFileDownload = useFileDownload(contextName);

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'CosmosFields';
  const uploadMultipleFilesLabel = localizedVal('file_upload_text_multiple', localeCategory);
  const uploadSingleFileLabel = localizedVal('file_upload_text_one', localeCategory);
  const deleteIcon = Utils.getImageSrc('trash', Utils.getSDKStaticConentUrl());
  const srcImg = Utils.getImageSrc('document-doc', Utils.getSDKStaticConentUrl());

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toggleUploadBegin, setToggleUploadBegin] = useState(false);

  const deleteFile = useCallback(
    (file, fileIndex) => {
      setAnchorEl(null);

      // reset the file input so that it will allow re-uploading the same file after deletion
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset the input
      }

      if (filesWithError.current.length > 0) {
        filesWithError.current = filesWithError.current.filter(fileWithError => fileWithError.props.id !== file.props.id);
        if (filesWithError.current.length === 0) {
          clearFieldErrorMessages(pConn);
        }
      }

      if (file.inProgress) {
        // @ts-ignore - Expected 1 arguments, but got 2.ts(2554)
        PCore.getAttachmentUtils().cancelRequest(file.props.id, contextName);
        actionSequencer.deRegisterBlockingAction(contextName).catch(() => {});
        setFiles(localFiles => {
          return localFiles.filter(localFile => localFile.props.id !== file.props.id);
        });
      } else {
        deleteAttachments([file], pConn, multiAttachmentsInInlineEdit.current, {
          allowMultiple,
          isOldAttachment,
          isMultiAttachmentInInlineEditTable,
          attachmentCount: attachmentCount.current,
          deleteIndex: fileIndex
        } as any);
        // Filter out without deleted file and reset the file indexes
        setFiles(localFiles => {
          let tempLocalFiles = [...localFiles];
          tempLocalFiles = tempLocalFiles.filter(localFile => localFile.props.id !== file.props.id);
          tempLocalFiles.forEach(localFile => {
            if (!localFile.props.error && !file.props.error) {
              const updatedDeleteIndex =
                localFile.responseProps.deleteIndex > fileIndex ? localFile.responseProps.deleteIndex - 1 : localFile.responseProps.deleteIndex;

              localFile.props.onDelete = () => deleteFile(localFile, updatedDeleteIndex);

              localFile.responseProps.deleteIndex = updatedDeleteIndex;
            }
          });
          return tempLocalFiles;
        });
        if (!file.props.error) {
          attachmentCount.current -= 1;
        }
      }

      setToggleUploadBegin(false);
    },
    [pConn]
  );

  const onUploadProgress = (id, ev) => {
    const progress = Math.floor((ev.loaded / ev.total) * 100);
    setFiles(localFiles => [
      ...localFiles.map(localFile => {
        if (localFile.props?.id === id) {
          localFile.inProgress = true;
          localFile.props.progress = progress;
        }
        return localFile;
      })
    ]);
  };

  const populateErrorAndUpdateRedux = file => {
    const fieldName = (pConn.getStateProps() as any).value;
    // set errors to property to block submit even on errors in file upload
    PCore.getMessageManager().addMessages({
      messages: [
        {
          type: 'error',
          message: localizationService.getLocalizedText('Error with one or more files')
        }
      ],
      property: fieldName,
      pageReference: pConn.getPageReference(),
      context: contextName
    });
    insertAttachments([file], pConn, multiAttachmentsInInlineEdit.current, {
      allowMultiple,
      isOldAttachment,
      isMultiAttachmentInInlineEditTable,
      attachmentCount: attachmentCount.current
    } as any);
  };

  const errorHandler = (isFetchCanceled, file) => {
    return error => {
      if (!isFetchCanceled(error)) {
        let uploadFailMsg = localizationService.getLocalizedText('Something went wrong');
        if (error.response && error.response.data && error.response.data.errorDetails) {
          uploadFailMsg = localizationService.getLocalizedText(error.response.data.errorDetails[0].localizedValue);
        }

        setFiles(current => {
          return current.map((localFile, index) => {
            if (localFile.props.id === file.props.id) {
              localFile.props.meta = uploadFailMsg;
              localFile.props.error = true;
              localFile.props.onDelete = () => deleteFile(localFile, index);
              localFile.props.icon = getIconFromFileType(localFile.type);
              localFile.props.name = localizationService.getLocalizedText('Unable to upload file');
              localFile.inProgress = false;
              delete localFile.props.progress;
              filesWithError.current.push(localFile);

              populateErrorAndUpdateRedux(localFile);
            }
            return localFile;
          });
        });
      }
      throw error;
    };
  };

  const onFileAdded = event => {
    let addedFiles = Array.from(event.target.files);
    addedFiles = allowMultiple ? addedFiles : [addedFiles[0]];
    const maxAttachmentSize = PCore.getEnvironmentInfo().getMaxAttachmentSize() || '5';
    const tempFilesToBeUploaded = [
      ...addedFiles.map((f: any, index) => {
        f.ID = `${new Date().getTime()}I${index}`;
        f.props = {
          type: f.type,
          name: f.name,
          id: f.ID,
          format: f.name.split('.').pop(),
          icon: getIconFromFileType(f.type),
          onDelete: () => deleteFile(f, index),
          thumbnail: window.URL.createObjectURL(f)
        };
        if (!validateMaxSize(f, maxAttachmentSize)) {
          f.props.error = true;
          f.props.meta = localizationService.getLocalizedText(`File is too big. Max allowed size is ${maxAttachmentSize}MB.`);
        } else if (!validateFileExtension(f, extensions)) {
          f.props.error = true;
          f.props.meta = `${localizationService.getLocalizedText('File has invalid extension. Allowed extensions are:')} ${extensions.replaceAll(
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
                message: localizationService.getLocalizedText('Error with one or more files')
              }
            ],
            property: fieldName,
            pageReference: pConn.getPageReference(),
            context: contextName
          });
        }
        return f;
      })
    ];

    const tempFilesWithError = tempFilesToBeUploaded.filter(f => f.props.error);
    if (tempFilesWithError.length > 0) {
      filesWithError.current = [...filesWithError.current, ...tempFilesWithError];

      insertAttachments(tempFilesWithError, pConn, multiAttachmentsInInlineEdit.current, {
        allowMultiple,
        isOldAttachment,
        isMultiAttachmentInInlineEditTable,
        attachmentCount: attachmentCount.current
      } as PageInstructionOptions);
    }
    setFiles(current => (!allowMultiple ? [...tempFilesToBeUploaded] : [...current, ...tempFilesToBeUploaded]));
    setToggleUploadBegin(true);
  };

  const uploadFiles = useCallback(() => {
    const filesToBeUploaded = files
      .filter(e => {
        const isFileUploaded = e.props && e.props.progress === 100;
        const fileHasError = e.props && e.props.error;
        const isFileUploadedInLastStep = e.responseProps && e.responseProps.ID !== 'temp';
        const isFileUploadInProgress = e.inProgress;
        return !isFileUploadInProgress && !isFileUploaded && !fileHasError && !isFileUploadedInLastStep;
      })
      .map(file =>
        PCore.getAttachmentUtils().uploadAttachment(
          file,
          ev => {
            onUploadProgress(file.props.id, ev);
          },
          isFetchCanceled => {
            return errorHandler(isFetchCanceled, file);
          },
          contextName
        )
      );

    // allow new files to be added when other files upload is still in progress
    setToggleUploadBegin(false);
    Promise.allSettled(filesToBeUploaded)
      .then((fileResponses: any) => {
        fileResponses = fileResponses.filter(fr => fr.status !== 'rejected'); // in case of deleting an in progress file, promise gets cancelled but still enters then block
        if (fileResponses.length > 0) {
          setFiles(localFiles => {
            const tempFilesUploaded = [...localFiles];
            tempFilesUploaded.forEach(localFile => {
              // if attach field has multiple files & in bw any error files are present
              // Example : files = [properFile1, errFile, errFile, properFile2]
              // indexes for delete & preview should be for files [properFile1, properFile2] which is [1,2]
              const index = fileResponses.findIndex(fileResponse => fileResponse.value.clientFileID === localFile.props.id);
              if (index >= 0) {
                fileResponses[index].value.thumbnail = localFile.props.thumbnail;
                localFile.inProgress = false;
                localFile.ID = fileResponses[index].value.ID;
                localFile.props.meta = localizationService.getLocalizedText('Uploaded successfully');
                localFile.props.progress = 100;
                localFile.handle = fileResponses[index].value.ID;
                localFile.label = valueRef;
                localFile.responseProps = {
                  pzInsKey: 'temp'
                };
              }
            });
            return tempFilesUploaded;
          });

          insertAttachments(fileResponses, pConn, multiAttachmentsInInlineEdit.current, {
            allowMultiple,
            isOldAttachment,
            isMultiAttachmentInInlineEditTable,
            attachmentCount: attachmentCount.current,
            insert: true
          } as any);
          attachmentCount.current += fileResponses.length;

          if (filesWithError.current.length === 0) {
            clearFieldErrorMessages(pConn);
          }
        }
        actionSequencer.deRegisterBlockingAction(contextName).catch(() => {});
      })
      .catch(error => {
        console.log(error);
        setToggleUploadBegin(false);
      });
  }, [files]);

  useEffect(() => {
    if (toggleUploadBegin && files.length > 0) {
      actionSequencer.registerBlockingAction(contextName).then(() => {
        uploadFiles();
      });
    }
  }, [toggleUploadBegin]);

  useEffect(() => {
    if (filesWithError.current.length === 0) {
      clearFieldErrorMessages(pConn);
    }
  }, [filesWithError]);

  const memoizedAttachments = useDeepMemo(() => {
    return attachments;
  }, [attachments]);

  // Prepares new structure as per Cosmos component
  const transformAttachments = () => {
    const transformedFiles = [...attachments];
    let deleteIndex = -1;
    transformedFiles.forEach(attachment => {
      attachment.props.id = attachment.responseProps.ID;
      attachment.props.format = attachment.props.name.split('.').pop();
      if (attachment.props.error) {
        attachment.responseProps.deleteIndex = deleteIndex;
      } else {
        deleteIndex += 1;
        attachment.responseProps.deleteIndex = deleteIndex;
      }
      if (attachment.props.thumbnail) {
        thumbnailURLs.current.push(attachment.props.thumbnail);
      }
    });

    return transformedFiles;
  };

  useEffect(() => {
    const caseID = PCore.getStoreValue(`.${getMappedValue('pyID')}`, PCore.getResolvedConstantValue('caseInfo.content'), contextName);
    if (displayMode !== 'DISPLAY_ONLY') {
      PCore.getPubSubUtils().subscribe(
        PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION,
        () => {
          overrideLocalState.current = true;
        },
        caseID
      );
    }

    // When component mounts, only set local files state from redux.
    const serverFiles = transformAttachments();
    setFiles(serverFiles);
    filesWithError.current = serverFiles.filter(file => file.props.error);

    return () => {
      if (displayMode !== 'DISPLAY_ONLY') {
        PCore.getPubSubUtils().unsubscribe(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION, caseID);
      }
    };
  }, []);

  useEffect(() => {
    if (overrideLocalState.current) {
      const serverFiles = transformAttachments();
      overrideLocalState.current = false;
      attachmentCount.current = attachments.length;
      filesWithError.current = [];
      setFiles(serverFiles);
    } else {
      // Determine whether refresh call has overridden any error files in redux, push error files back to redux from local state to perform client side validation during assignment submit
      const errorFiles = attachments.filter(attachment => attachment.props.error);
      if (errorFiles.length === 0 && filesWithError.current.length > 0) {
        // Check if local file state contains error files and push those to redux
        const uniqueKey = getMappedValue('pzInsKey');
        const transformedErrorFiles = filesWithError.current.map(errorFile => {
          const filename = errorFile.props.name;
          return {
            [uniqueKey]: errorFile.props.id,
            FileName: filename,
            Category: '',
            FileExtension: filename.split('.').pop() ?? filename,
            error: errorFile.props.error || null
          };
        });
        let key = '';
        let updatedAttachments: any = [];
        if (allowMultiple || isOldAttachment) {
          key = isOldAttachment ? `${valueRef}.pxResults` : valueRef;
          const existingAttachments = PCore.getStoreValue(`.${key}`, pConn.getPageReference(), pConn.getContextName()) || [];
          updatedAttachments = [...existingAttachments, ...transformedErrorFiles];
        } else {
          key = valueRef;
          updatedAttachments = transformedErrorFiles[0];
        }
        PCore.getStateUtils().updateState(pConn.getContextName(), key, updatedAttachments, {
          pageReference: pConn.getPageReference(),
          isArrayDeepMerge: false,
          removePropertyFromChangedList: true
        });
      }
    }
  }, [memoizedAttachments]);

  const handleClick = event => {
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
            multiple={allowMultiple}
            required={required}
            disabled={disabled}
            onChange={onFileAdded}
          />
          <Button style={{ textTransform: 'none' }} variant='outlined' color='primary' component='span'>
            {allowMultiple
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
                  <button type='button' className='psdk-utility-button' aria-label='Delete Attachment' onClick={() => deleteFile(item, index)}>
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
                      <MenuItem style={{ fontSize: '14px' }} key='delete' onClick={() => deleteFile(item, index)}>
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
      {((files.length === 0 && !allowMultiple) || allowMultiple) && <section>{content}</section>}
      {validatemessage !== '' ? <span className='file-error'>{validatemessage}</span> : <span style={{ fontSize: '14px' }}>{helperText}</span>}
      {files && files.length > 0 && <section>{fileDisplay}</section>}
    </div>
  );
}
