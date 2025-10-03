import { useCallback } from 'react';
import download from 'downloadjs';

export const isContentBinary = (headers) => {
  return headers && headers['content-transfer-encoding'] === 'binary';
};

export const isContentBase64 = (headers) => {
  return headers && headers['content-transfer-encoding'] === 'base64';
};

export const fileDownload = (data, fileName, ext, headers) => {
  const name = ext ? `${fileName}.${ext}` : fileName;
  // Temp fix: downloading EMAIl type attachment as html file
  if (ext === 'html') {
    download(isContentBase64(headers) ? atob(data) : data, name, 'text/html');
  } else if (isContentBinary(headers)) {
    download(data, name);
  } else {
    download(atob(data), name);
  }
};

export const fileDownloadVar = (content, type, name, extension) => {
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

export const useFileDownload = (context) => {
  return useCallback(
    ({ ID, name, extension, type, category, responseType }) => {
      if (category !== 'pxDocument') {
        PCore.getAttachmentUtils()
          .downloadAttachment(ID, context, responseType)
          .then((content) => {
            fileDownloadVar(content, type, name, extension);
          })

          .catch(console.error);
      } else {
        PCore.getAttachmentUtils()
          // @ts-expect-error
          .downloadDocument(ID, context, responseType)
          .then((content) => {
            fileDownloadVar(content, type, name, extension);
          })

          .catch(console.error);
      }
    },
    [context],
  );
};

export const getIconFromFileType = (fileType): string => {
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
    const foundMatch = (sources) => {
      return sources.some((key) => subtype.includes(key));
    };

    if (foundMatch(['excel', 'spreadsheet'])) {
      icon = 'document-xls';
    } else if (foundMatch(['zip', 'compressed', 'gzip', 'rar', 'tar'])) {
      icon = 'document-compress';
    }
  }

  return icon;
};

export const validateMaxSize = (fileObj: any, maxSizeInMB: string): boolean => {
  const fileSize = (fileObj.size / 1048576).toFixed(2);
  return parseFloat(fileSize) < parseFloat(maxSizeInMB);
};

export const isFileUploadedToServer = (file) => file.responseProps && !file.responseProps.ID?.includes('temp');
