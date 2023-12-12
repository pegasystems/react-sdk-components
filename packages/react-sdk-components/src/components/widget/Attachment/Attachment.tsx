/* eslint-disable no-unused-vars */
/* eslint-disable react/jsx-boolean-value */

import { Button } from '@material-ui/core';
import React, { useState, useEffect, useCallback } from 'react';
import { buildFilePropsFromResponse, getIconFromFileType, validateMaxSize, getIconForAttachment } from '../../helpers/attachmentHelpers';
import './Attachment.css';
import { CircularProgress } from "@material-ui/core";
import download from "downloadjs";
import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';

// import type { PConnProps } from '../../../types/PConnProps';

// Remove this and use "real" PCore type once .d.ts is fixed (currently shows 2 errors)
declare const PCore: any;

// NOTE: we can't use PConnProps in this file because the
//  PConnect type is missing a number of expected properties
//  such as attachmentsInfo and incorrect type for our use of clearMessages,
// interface AttachmentProps extends PConnProps {
//   // If any, enter additional props that only exist on this component
// }


const getAttachmentKey = (name='') => name ? `attachmentsList.${name}` : 'attachmentsList';

function getCurrentAttachmentsList(key, context) {
  return PCore.getStoreValue(`.${key}`, 'context_data', context) || [];
}

export default function Attachment(props /* :AttachmentProps */) {
  console.log('Attachment', props);
  // Get emitted components from map (so we can get any override that may exist)
  const SummaryList = getComponentFromMap('SummaryList');

  const PCoreVersion = PCore.getPCoreVersion();
  const {value, getPConnect, label, validatemessage, allowMultiple, extensions} = props;
  /* this is a temporary fix because required is supposed to be passed as a boolean and NOT as a string */
  let { required, disabled } = props;
  [required, disabled] = [required, disabled].map(
    prop => prop === true || (typeof prop === 'string' && prop === 'true')
  );
  let arFileList$: Array<any> = [];
  const pConn = getPConnect();
  const caseID = PCore.getStoreValue('.pyID', 'caseInfo.content', pConn.getContextName());
  let fileTemp: any = {};

  let categoryName = '';
  if (value && value.pyCategoryName) {
    categoryName = value.pyCategoryName;
  }

  let valueRef = pConn.getStateProps()["value"];
  valueRef = valueRef.indexOf('.') === 0 ? valueRef.substring(1) : valueRef;
  const [file, setFile] = useState(fileTemp);
  const [files, setFiles] = useState<Array<any>>([]);
  const [filesWithError, setFilesWithError] = useState<Array<any>>([]);
  const [toggleUploadBegin, setToggleUploadBegin] = useState(false);
  // setToggleUploadBegin(true);

  const resetAttachmentStoredState = () => {
    PCore.getStateUtils().updateState(pConn.getContextName(), getAttachmentKey(PCoreVersion?.includes('8.23') ? valueRef : ''), undefined, {
      pageReference: 'context_data',
      isArrayDeepMerge: false
    });
  };

  const fileDownload = (data, fileName, ext) => {
    const fileData = ext ? `${fileName}.${ext}` : fileName;
    download(atob(data), fileData);
  };

  function _downloadFileFromList(fileObj: any) {
    PCore.getAttachmentUtils()
      .downloadAttachment(fileObj.pzInsKey, pConn.getContextName())
      .then((content) => {
        const extension = fileObj.pyAttachName.split(".").pop();
        fileDownload(content.data, fileObj.pyFileName, extension);
      })
      .catch(() => {});
  }

  function setNewFiles(arFiles) {
    let index = 0;
    const maxAttachmentSize = 5;
    for (const item of arFiles) {
      if (!validateMaxSize(item, maxAttachmentSize.toString())) {
        item.error = true;
        item.meta = pConn.getLocalizedValue(`File is too big. Max allowed size is ${maxAttachmentSize}MB.`, '', '');     // 2nd and 3rd args empty string until typedef marked correctly
      }
      item.mimeType = item.type;
      item.icon = getIconFromFileType(item.type);
      item.ID = `${new Date().getTime()}I${index}`;
      index+=1;
    }
    return arFiles;
  }

  function getFiles(arFiles: Array<any>) {
    return setNewFiles(arFiles);
  }

  function getNewListUtilityItemProps(this: any, {
    att,
    cancelFile,
    downloadFile,
    deleteFile,
    removeFile
  }) {
    let actions;
    if (att.progress && att.progress !== 100) {
      actions = [
        {
          id: `Cancel-${att.ID}`,
          text: pConn.getLocalizedValue('Cancel', '', ''),     // 2nd and 3rd args empty string until typedef marked correctly
          icon: "times",
          onClick: cancelFile
        }
      ];
    } else if (att.links) {
      const isFile = att.type === "FILE";
      const ID = att.ID.replace(/\s/gi, "");
      const actionsMap = new Map([
        [
          "download",
          {
            id: `download-${ID}`,
            text: isFile ? pConn.getLocalizedValue('Download', '', '') : pConn.getLocalizedValue('Open', '', ''),
            icon: isFile ? "download" : "open",
            onClick: downloadFile
          }
        ],
        [
          "delete",
          {
            id: `Delete-${ID}`,
            text: pConn.getLocalizedValue('Delete', '', ''),
            icon: "trash",
            onClick: deleteFile
          }
        ]
      ]);
      actions = [];
      actionsMap.forEach((action, actionKey) => {
        if (att.links[actionKey]) {
          actions.push(action);
        }
      });
    } else if (att.error) {
      actions = [
        {
          id: `Remove-${att.ID}`,
          text: pConn.getLocalizedValue('Remove', '', ''),
          icon: "trash",
          onClick: removeFile
        }
      ];
    }
    return  {
      id: att.ID,
      visual: {
        icon: getIconForAttachment(this, att),
        progress: att.progress === 100 ? undefined: att.progress,
      },
      primary: {
        type: att.type,
        name: att.error ? att.fileName : att.name,
        icon: "trash",
        click: removeFile,
      },
      secondary: {
        text: att.meta,
        error: att.error
      },
      actions
    };
  };

  // const errorHandler = (isFetchCanceled) => {
  //   return (error) => {
  //     if (!isFetchCanceled(error)) {
  //       let uploadFailMsg = pConn.getLocalizedValue('Something went wrong', '', '');     // 2nd and 3rd args empty string until typedef marked correctly
  //       if (error.response && error.response.data && error.response.data.errorDetails) {
  //         uploadFailMsg = pConn.getLocalizedValue(error.response.data.errorDetails[0].localizedValue, '', '');     // 2nd and 3rd args empty string until typedef marked correctly
  //       }
  //       myFiles[0].meta = uploadFailMsg;
  //       myFiles[0].error = true;
  //       myFiles[0].fileName = pConn.getLocalizedValue('Unable to upload file', '', '');     // 2nd and 3rd args empty string until typedef marked correctly
  //       arFileList$ = myFiles.map((att) => {
  //         return getNewListUtilityItemProps({
  //           att,
  //           downloadFile: null,
  //           cancelFile: null,
  //           deleteFile: null,
  //           removeFile: null
  //         });
  //       });
  //       setFile((current) => {
  //         console.log('current', current);
  //         return {
  //           ...current,
  //           props: {
  //             ...current.props,
  //             arFileList$
  //           },
  //           inProgress: false,
  //           attachmentUploaded: true,
  //           showMenuIcon: false
  //         };
  //       });
  //     }
  //     throw error;
  //   };
  // };

  const onUploadProgress = (id, ev) => {
    const progress = Math.floor((ev.loaded / ev.total) * 100) - 1;
    setFiles((current) => [
      ...current.map((f) => {
        if (f.ID === id) {
          f.inProgress = true;
          f.props.progress = progress;
        }
        return f;
      })
    ]);
  };

  const errorHandler = (isFetchCanceled, attachedFile) => {
    return (error) => {
      if (!isFetchCanceled(error)) {
        let uploadFailMsg = pConn.getLocalizedValue('Something went wrong');
        if (error.response && error.response.data && error.response.data.errorDetails) {
          uploadFailMsg = pConn.getLocalizedValue(error.response.data.errorDetails[0].localizedValue);
        }
        setFiles((current) => {
          return current.map((f) => {
            if (f.ID === attachedFile.ID) {
              f.props.meta = uploadFailMsg;
              f.props.error = true;
              f.props.onDelete = null;
              f.props.icon = getIconFromFileType(f.type);
              f.props.name = pConn.getLocalizedValue('Unable to upload file');
              f.inProgress = false;
              const fieldName = pConn.getStateProps().value;
              const context = pConn.getContextName();
              // set errors to property to block submit even on errors in file upload
              PCore.getMessageManager().addMessages({
                messages: [
                  {
                    type: 'error',
                    message: pConn.getLocalizedValue('Error with one or more files')
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

  const onFileAdded = (event) => {
    let addedFiles = Array.from(event.target.files);
    addedFiles = allowMultiple === 'true' ? addedFiles : [addedFiles[0]];
    const maxAttachmentSize = PCore.getEnvironmentInfo().getMaxAttachmentSize() || 5;
    const tempFilesToBeUploaded = [
      ...addedFiles.map((f: any, index) => {
        f.ID = `${new Date().getTime()}I${index}`;;
        f.props = {
          type: f.type,
          name: f.name,
          icon: getIconFromFileType(f.type),
          onDelete: null
        };
        if (!validateMaxSize(f, maxAttachmentSize)) {
          f.props.error = true;
          f.props.meta = pConn.getLocalizedValue(`File is too big. Max allowed size is ${maxAttachmentSize}MB.`);
        } else if (!validateFileExtension(f, extensions)) {
          f.props.error = true;
          f.props.meta = `${pConn.getLocalizedValue(
            'File has invalid extension. Allowed extensions are:'
          )} ${extensions.replaceAll('.', '')}`;
        }
        if (f.props.error) {
          const fieldName = pConn.getStateProps().value;
          const context = pConn.getContextName();
          PCore.getMessageManager().addMessages({
            messages: [
              {
                type: 'error',
                message: pConn.getLocalizedValue('Error with one or more files')
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
    setFiles((current) =>
      allowMultiple !== 'true' ? [...tempFilesToBeUploaded] : [...current, ...tempFilesToBeUploaded]
    );
    setToggleUploadBegin(true);
  }

  const clearFieldErrorMessages = () => {
    const fieldName = pConn.getStateProps().value;
    const context = pConn.getContextName();
    PCore.getMessageManager().clearMessages({
      type: PCore.getConstants().MESSAGES.MESSAGES_TYPE_ERROR,
      property: fieldName,
      pageReference: pConn.getPageReference(),
      context
    });
  };

  console.log('files1', files);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const uploadFiles = useCallback(() => {
    console.log('uploadFiles', files);
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
          (ev) => {
            onUploadProgress(f.ID, ev);
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
                f.props.meta = pConn.getLocalizedValue('Uploaded successfully');
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
        // eslint-disable-next-line no-console
        console.log(error);
        setToggleUploadBegin(false);
      });
  }, [files, filesWithError]);

  // const onFileAdded = (event) => {
  //  const addedFile = event.target.files;
  //   setFile({
  //     props: {
  //       name: addedFile.name,
  //       icon: getIconFromFileType(addedFile.type),
  //     },
  //     inProgress: true
  //   });
  //   const arFiles$ = getFiles(event.target.files);
  //   const myFiles: any = Array.from(arFiles$);

  //   const onUploadProgress = () => {};

  //   PCore.getAttachmentUtils()
  //     .uploadAttachment(
  //       myFiles[0],
  //       onUploadProgress,
  //       errorHandler,
  //       pConn.getContextName()
  //     )
  //     .then((fileRes) => {
  //       let reqObj;
  //       if (PCoreVersion?.includes('8.7')) {
  //         reqObj = {
  //           type: "File",
  //           attachmentFieldName: valueRef,
  //           category: categoryName,
  //           ID: fileRes.ID
  //         };
  //         pConn.attachmentsInfo = reqObj;
  //       } else {
  //         reqObj = {
  //           type: "File",
  //           label: valueRef,
  //           category: categoryName,
  //           handle: fileRes.ID,
  //           ID: fileRes.clientFileID
  //         };
  //         const currentAttachmentList = getCurrentAttachmentsList( getAttachmentKey(PCoreVersion?.includes('8.23') ? valueRef : ''), pConn.getContextName()).filter(
  //           (f) => f.label !== valueRef
  //         );
  //         PCore.getStateUtils().updateState(
  //           pConn.getContextName(),
  //           getAttachmentKey(PCoreVersion?.includes('8.23') ? valueRef : ''),
  //           [...currentAttachmentList, reqObj],
  //           {
  //             pageReference: 'context_data',
  //             isArrayDeepMerge: false
  //           }
  //         );
  //       }
  //       const fieldName = pConn.getStateProps()["value"];
  //       const context = pConn.getContextName();

  //       PCore.getMessageManager().clearMessages({
  //         type: PCore.getConstants().MESSAGES.MESSAGES_TYPE_ERROR,
  //         property: fieldName,
  //         pageReference: pConn.getPageReference(),
  //         context
  //       });
  //       myFiles[0].meta = pConn.getLocalizedValue('Uploaded successfully', '', '');     // 2nd and 3rd args empty string until typedef marked correctly

  //       arFileList$ = myFiles.map((att) => {
  //         return getNewListUtilityItemProps({
  //           att,
  //           downloadFile: null,
  //           cancelFile: null,
  //           deleteFile: null,
  //           removeFile: null
  //         });
  //       });
  //       setFile((current) => {
  //         console.log('current', current);
  //         return {
  //           ...current,
  //           props: {
  //             ...current.props,
  //             arFileList$
  //           },
  //           inProgress: false,
  //           attachmentUploaded: true,
  //           showMenuIcon: false
  //         };
  //       });
  //     })

  //     .catch(() => {
  //       // just catching the rethrown error at uploadAttachment
  //       // to handle Unhandled rejections
  //     });
  // };

  function _removeFileFromList(item: any, list) {
    const arFileList = file.props ? file.props.arFileList$ : list;
    const fileIndex = arFileList.findIndex(element => element?.id === item?.id);
    if (PCoreVersion?.includes('8.7')) {
      if (value) {
        pConn.attachmentsInfo = {
          type: "File",
          attachmentFieldName: valueRef,
          delete: true
        };
      }
      if (fileIndex > -1) { arFileList.splice(parseInt(fileIndex, 10), 1) };
      setFile((current) => {
        console.log('current', current);
        return {
          ...current,
          props: {
            ...current.props,
            arFileList
          },
        };
      });
    } else {
      const attachmentsList = [];
      const currentAttachmentList = getCurrentAttachmentsList( getAttachmentKey(PCoreVersion?.includes('8.23') ? valueRef : ''), pConn.getContextName()).filter(
        (f) => f.label !== valueRef
      );
      if (value && value.pxResults && +value.pyCount > 0) {
        const deletedFile = {
          type: "File",
          label: valueRef,
          delete: true,
          responseProps: {
            pzInsKey: arFileList[fileIndex].id
          },
        };
        // updating the redux store to help form-handler in passing the data to delete the file from server
        PCore.getStateUtils().updateState(
          pConn.getContextName(),
          getAttachmentKey(PCoreVersion?.includes('8.23') ? valueRef : ''),
          [...currentAttachmentList, deletedFile],
          {
            pageReference: 'context_data',
            isArrayDeepMerge: false
          }
        );
      } else {
        PCore.getStateUtils().updateState(
          pConn.getContextName(),
          getAttachmentKey(PCoreVersion?.includes('8.23') ? valueRef : ''),
          [...currentAttachmentList, ...attachmentsList],
          {
            pageReference: 'context_data',
            isArrayDeepMerge: false
          }
        );
      }
      if (fileIndex > -1) { arFileList.splice(parseInt(fileIndex, 10), 1) };
      setFile((current) => {
        return {
          ...current,
          props: {
            ...current.props,
            arFileList
          },
        };
      });
    }
  }

  useEffect(() => {
    if (toggleUploadBegin && files.length > 0) {
      uploadFiles();
    }
  }, [toggleUploadBegin]);

  useEffect(() => {
    if (value && value.pxResults && +value.pyCount > 0) {
    fileTemp = buildFilePropsFromResponse(value.pxResults[0]);

    if (fileTemp.responseProps) {
      if (!pConn.attachmentsInfo) {
        pConn.attachmentsInfo = {
          type: "File",
          attachmentFieldName: valueRef,
          category: categoryName
        };
      }

      if (fileTemp.responseProps.pzInsKey && !fileTemp.responseProps.pzInsKey.includes("temp")) {

        fileTemp.props.type = fileTemp.responseProps.pyMimeFileExtension;
        fileTemp.props.mimeType = fileTemp.responseProps.pyMimeFileExtension;
        fileTemp.props.ID = fileTemp.responseProps.pzInsKey;
        // create the actions for the "more" menu on the attachment
        const arMenuList: Array<any> = [];
        let oMenu: any = {};

        oMenu.icon = "download";
        oMenu.text = pConn.getLocalizedValue('Download', '', '');     // 2nd and 3rd args empty string until typedef marked correctly
        oMenu.onClick = () => { _downloadFileFromList(value.pxResults[0])}
        arMenuList.push(oMenu);
        oMenu = {};
        oMenu.icon = "trash";
        oMenu.text = pConn.getLocalizedValue('Delete', '', '');     // 2nd and 3rd args empty string until typedef marked correctly
        oMenu.onClick = () => { _removeFileFromList(arFileList$[0], arFileList$)}
        arMenuList.push(oMenu);

        arFileList$.push(getNewListUtilityItemProps({
          att: fileTemp.props,
          downloadFile: null,
          cancelFile: null,
          deleteFile: null,
          removeFile: null
        }));
        arFileList$[0].actions = arMenuList;

        setFile((current) => {
          console.log('current', current);
          return {
            ...current,
            props: {
              ...current.props,
              arFileList$
            },
            inProgress: false,
            attachmentUploaded: true,
            showMenuIcon: true
          };
        });
      }

      if (fileTemp) {
        const currentAttachmentList = getCurrentAttachmentsList( getAttachmentKey(PCoreVersion?.includes('8.23') ? valueRef : ''), pConn.getContextName());
        const index = currentAttachmentList.findIndex(element => element.props.ID === fileTemp.props.ID);
        let tempFiles: any = [];
        if (index < 0) {
          tempFiles = [fileTemp];
        }
        PCore.getStateUtils().updateState(
          pConn.getContextName(),
          getAttachmentKey(PCoreVersion?.includes('8.23') ? valueRef : ''),
          [...currentAttachmentList, ...tempFiles],
          {
            pageReference: 'context_data',
            isArrayDeepMerge: false
          }
        );
      }
    }
    }
    PCore.getPubSubUtils().subscribe(
      PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION,
      resetAttachmentStoredState,
      caseID
    );
    return () => {
      PCore.getPubSubUtils().unsubscribe(PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.ASSIGNMENT_SUBMISSION, caseID);
    };
  }, []);

  let content = (
    <div className={`${validatemessage === '' ? 'file-div' : 'file-div-error'}`}>
        {file.inProgress && (<div className="progress-div"><CircularProgress /></div>)}
        <div hidden={true} id="attachment-ID">{valueRef}</div>
        <label htmlFor={valueRef}>
          <input
            style={{ display: 'none' }}
            id={valueRef}
            name='upload-photo'
            type='file'
            multiple={allowMultiple === 'true'}
            required={required}
            onChange={onFileAdded}
          />
          <Button variant='outlined' color='primary' component="span">
            Upload file
          </Button>
        </label>
    </div>
  );

  // files.forEach((file: any) => {
  //   if (file && file.attachmentUploaded && file.props.arFileList$ && file.props.arFileList$.length > 0) {
  //     content = (
  //       <div>
  //          {file.showMenuIcon && (<SummaryList arItems$={file.props.arFileList$} menuIconOverrideAction$={_removeFileFromList}></SummaryList>)}
  //          {!file.showMenuIcon && (<SummaryList menuIconOverride$='trash' arItems$={file.props.arFileList$} menuIconOverrideAction$={_removeFileFromList}></SummaryList>)}
  //       </div>

  //     );
  //   }
  // })

  if (file && file.attachmentUploaded && file.props.arFileList$ && file.props.arFileList$.length > 0) {
    content = (
      <div>
         {file.showMenuIcon && (<SummaryList arItems$={file.props.arFileList$} menuIconOverrideAction$={_removeFileFromList}></SummaryList>)}
         {!file.showMenuIcon && (<SummaryList menuIconOverride$='trash' arItems$={file.props.arFileList$} menuIconOverrideAction$={_removeFileFromList}></SummaryList>)}
      </div>

    );
  }


  return (
    <div className='file-upload-container'>
      <span className={`label ${required ? 'file-label' : ''}`}>{label}</span>
      <section>{content}</section>
      {validatemessage !== "" ? <span className='file-error'>{validatemessage}</span> : ''}
    </div>
  );
}
