import { useCallback, useRef } from 'react';
import download from 'downloadjs';
import equal from 'fast-deep-equal';

import type { FileObject, PageInstructionOptions, ReduxAttachments } from './Attachment.types';

export const isContentBinary = (headers: Record<string, string>) => {
  return headers && headers['content-transfer-encoding'] === 'binary';
};

export const isContentBase64 = (headers: Record<string, string>) => {
  return headers && headers['content-transfer-encoding'] === 'base64';
};

export const validateFileExtension = (fileObj: Record<string, string>, allowedExtensions: string) => {
  if (!allowedExtensions) {
    return true;
  }
  const allowedExtensionList = allowedExtensions
    .toLowerCase()
    .split(',')
    .map(item => item.replaceAll('.', '').trim());
  const extension = fileObj.name.split('.').pop()?.toLowerCase() || '';
  return allowedExtensionList.includes(extension);
};

export const fileDownload = (data: string | Blob, fileName: string, ext: string | null, headers: Record<string, string>) => {
  const name = ext ? `${fileName}.${ext}` : fileName;
  // Temp fix: downloading EMAIl type attachment as html file
  if (ext === 'html') {
    download(isContentBase64(headers) ? atob(data as string) : data, name, 'text/html');
  } else if (isContentBinary(headers)) {
    download(data, name);
  } else {
    download(atob(data as string), name);
  }
};

export const getIconFromFileType = (fileType: string) => {
  let icon = 'document-doc';
  if (!fileType) return icon;
  if (fileType.startsWith('audio')) {
    icon = 'audio';
  } else if (fileType.startsWith('video')) {
    icon = 'video';
  } else if (fileType.startsWith('image')) {
    icon = 'picture';
  } else if (fileType.includes('pdf')) {
    icon = 'document-pdf';
  } else {
    const [, subtype] = fileType.split('/');
    const foundMatch = (sources: string[]) => {
      return sources.some(key => subtype.includes(key));
    };

    if (foundMatch(['excel', 'spreadsheet'])) {
      icon = 'document-xls';
    } else if (foundMatch(['zip', 'compressed', 'gzip', 'rar', 'tar'])) {
      icon = 'document-compress';
    }
  }

  return icon;
};

export const fileDownloadVar = (content: { data: string; headers: Record<string, string> }, type: string, name: string, extension: string) => {
  if (type === 'FILE' || type === undefined) {
    fileDownload(content.data, name, extension, content.headers);
  } else if (type === 'URL') {
    let { data } = content;
    if (!/^(http|https):\/\//.test(data)) {
      data = `//${data}`;
    }
    window.open(content.data, '_blank');
  } else if (type === 'EMAIL') {
    // Temp Fix: for EMAIL type attachment
    fileDownload(content.data, name, 'html', content.headers);
  }
};

export const getMappedValue = (value: string): string => {
  return PCore.getEnvironmentInfo().getKeyMapping(value) ?? value;
};

const generateInstructions = (
  files: FileObject[],
  pConn: typeof PConnect,
  attachmentsInModal: ReduxAttachments[] | Pick<ReduxAttachments, 'instruction' | 'fileIndex'>[],
  options: {
    allowMultiple: boolean;
    isMultiAttachmentInInlineEditTable: boolean;
    attachmentCount: number;
    insertPageInstruction: boolean;
    deletePageInstruction: boolean;
    deleteIndex: number;
  }
) => {
  const { allowMultiple, isMultiAttachmentInInlineEditTable, attachmentCount, insertPageInstruction, deletePageInstruction, deleteIndex } = options;
  const transformedAttachments: ReduxAttachments[] = [];
  let valueRef = pConn.getStateProps().value;
  valueRef = valueRef?.indexOf('.') === 0 ? valueRef.substring(1) : valueRef;
  const uniqueKey = getMappedValue('pzInsKey');
  files.forEach((file, index) => {
    const filename = file.value?.filename || file.props?.name || '';
    const payload = {
      [uniqueKey]: file.value?.ID || file.props?.id,
      FileName: filename,
      Category: '',
      // MimeType: getMimeTypeFromFile(filename),
      FileExtension: filename.split('.').pop() ?? filename,
      error: file.props?.error || null,
      localAttachment: true,
      thumbnail: file.value?.thumbnail
    };
    transformedAttachments.push(payload);
    if (payload.error) {
      return; // Don't process page instructions for error files, skip current iteration
    }
    if (allowMultiple) {
      if (isMultiAttachmentInInlineEditTable) {
        if (insertPageInstruction) {
          attachmentsInModal.push({ ...payload, instruction: 'insert' } as any);
        } else if (deletePageInstruction) {
          (attachmentsInModal as Pick<ReduxAttachments, 'instruction' | 'fileIndex'>[]).push({
            instruction: 'delete',
            fileIndex: deleteIndex
          });
        }
      } else if (insertPageInstruction) {
        pConn.getListActions().insert({ ID: payload[uniqueKey] }, attachmentCount + index, undefined, {
          skipStateUpdate: true
        });
      } else if (deletePageInstruction) {
        pConn.getListActions().deleteEntry(deleteIndex, undefined, { skipStateUpdate: true });
      }
    } else if (insertPageInstruction) {
      pConn.getListActions().replacePage(`.${valueRef}`, { ID: payload[uniqueKey] }, { skipStateUpdate: true });
    } else if (deletePageInstruction) {
      pConn.getListActions().deletePage(`.${valueRef}`, { skipStateUpdate: true });
    }
  });
  return transformedAttachments;
};

export const updateReduxState = (
  transformedAttachments: ReduxAttachments[],
  pConn: typeof PConnect,
  valueRef: string,
  options: PageInstructionOptions
) => {
  const { allowMultiple, isOldAttachment, insertRedux, deleteRedux } = options;
  let deleteIndex = -1;

  if (allowMultiple || isOldAttachment) {
    transformedAttachments.forEach(attachment => {
      const key = isOldAttachment ? `${valueRef}.pxResults` : valueRef;
      const existingAttachments: ReduxAttachments[] = PCore.getStoreValue(`.${key}`, pConn.getPageReference(), pConn.getContextName()) || [];

      if (insertRedux) {
        const actionPayLoad = {
          type: 'LIST_ACTION',
          payload: {
            instruction: 'INSERT',
            context: pConn.getContextName(),
            referenceList: `${pConn.getPageReference()}.${key}`,
            listIndex: existingAttachments.length,
            content: attachment
          }
        };
        PCore.getStore()?.dispatch(actionPayLoad);
      } else if (deleteRedux) {
        const uniqueKey = getMappedValue('pzInsKey');
        deleteIndex = existingAttachments.findIndex(
          existingAttachment =>
            existingAttachment[uniqueKey as keyof ReduxAttachments] === transformedAttachments[0][uniqueKey as keyof ReduxAttachments]
        );
        const actionPayLoad = {
          type: 'LIST_ACTION',
          payload: {
            instruction: 'DELETE',
            context: pConn.getContextName(),
            referenceList: `${pConn.getPageReference()}.${key}`,
            listIndex: deleteIndex
          }
        };
        PCore.getStore()?.dispatch(actionPayLoad);
      }
    });
  } else if (insertRedux) {
    const actionPayLoad = {
      type: 'LIST_ACTION',
      payload: {
        instruction: 'REPLACE',
        context: pConn.getContextName(),
        referenceList: `${pConn.getPageReference()}.${valueRef}`,
        content: transformedAttachments[0]
      }
    };
    PCore.getStore()?.dispatch(actionPayLoad);
  } else if (deleteRedux) {
    const actionPayLoad = {
      type: 'LIST_ACTION',
      payload: {
        instruction: 'DELETEPAGE',
        context: pConn.getContextName(),
        referenceList: `${pConn.getPageReference()}.${valueRef}`
      }
    };
    PCore.getStore()?.dispatch(actionPayLoad);
  }
};

export const insertAttachments = (
  files: FileObject[],
  pConn: typeof PConnect,
  attachmentsInModal: ReduxAttachments[],
  options: PageInstructionOptions
) => {
  const { isMultiAttachmentInInlineEditTable } = options;
  let valueRef = pConn.getStateProps().value;
  valueRef = valueRef?.indexOf('.') === 0 ? valueRef.substring(1) : valueRef;
  const transformedAttachments = generateInstructions(files, pConn, attachmentsInModal, {
    ...options,
    insertPageInstruction: true
  });

  if (isMultiAttachmentInInlineEditTable) {
    return; // For attachments within modal, redux update is not necessary yet, as modal isn't submitted at this stage
  }
  updateReduxState(transformedAttachments, pConn, valueRef, { ...options, insertRedux: true });
};

export const deleteAttachments = (
  files: FileObject[],
  pConn: typeof PConnect,
  attachmentsInModal: Pick<ReduxAttachments, 'instruction' | 'fileIndex'>[],
  options: PageInstructionOptions
) => {
  const { isMultiAttachmentInInlineEditTable } = options;
  let valueRef = pConn.getStateProps().value;
  valueRef = valueRef?.indexOf('.') === 0 ? valueRef.substring(1) : valueRef;
  const transformedAttachments = generateInstructions(files, pConn, attachmentsInModal, {
    ...options,
    deletePageInstruction: true
  });

  if (isMultiAttachmentInInlineEditTable) {
    return; // For attachments within modal, redux update is not necessary yet, as modal isn't submitted at this stage
  }
  updateReduxState(transformedAttachments, pConn, valueRef, { ...options, deleteRedux: true });
};

export const clearFieldErrorMessages = (pConn: typeof PConnect) => {
  const fieldName = pConn.getStateProps().value;
  PCore.getMessageManager().clearMessages({
    type: PCore.getConstants().MESSAGES.MESSAGES_TYPE_ERROR,
    property: fieldName,
    pageReference: pConn.getPageReference(),
    context: pConn.getContextName()
  });
};

export const useFileDownload = (context: string) => {
  return useCallback(
    ({
      ID,
      name,
      extension,
      type,
      category,
      responseType
    }: {
      ID: string;
      name: string;
      extension: string;
      type: string;
      category: string;
      responseType: string;
    }) => {
      if (category !== 'pxDocument') {
        (
          PCore.getAttachmentUtils().downloadAttachment(ID, context, responseType) as Promise<{
            data: string;
            headers: Record<string, string>;
          }>
        )
          .then(content => {
            fileDownloadVar(content, type, name, extension);
          })

          .catch(console.error);
      } else {
        (
          PCore.getAttachmentUtils().downloadDocument(ID, context) as Promise<{
            data: string;
            headers: Record<string, string>;
          }>
        )
          .then(content => {
            fileDownloadVar(content, type, name, extension);
          })

          .catch(console.error);
      }
    },
    [context]
  );
};

export const useDeepMemo = (memoFn, key) => {
  const ref: any = useRef();
  if (!ref.current || !equal(key, ref.current.key)) {
    ref.current = { key, value: memoFn() };
  }
  return ref.current.value;
};
