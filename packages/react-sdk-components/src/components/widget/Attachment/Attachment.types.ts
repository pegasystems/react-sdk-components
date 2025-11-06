import type { ReactElement, Ref } from 'react';

export interface ResponseProps {
  ID: string;
  extension: string;
  createDateTime?: Date | string | number;
  createUser?: string;
  name: string;
}

export interface AttachmentActions {
  rel: string;
  href: string;
  title: string;
  type: string;
}

export interface AttachmentLinks {
  delete: AttachmentActions;
  download: AttachmentActions;
  edit: AttachmentActions;
}
export interface FileObject extends File {
  icon?: string;
  ID: string;
  fileName: string;
  category: string;
  responseType: string;
  fileType: string;
  mimeType: string;
  extension: string;
  thumbnail?: string;
  nameWithExt: string;
  inProgress?: boolean;
  progress?: number;
  handle: string;
  label: string;
  delete?: boolean;
  error?: boolean;
  description: string;

  props: {
    icon?: string;

    ref?: Ref<HTMLDivElement>;
    id: string;
    error?: string;
    format?: string;
    name: string;
    thumbnail?: string;
    onPreview?: () => void;
    onDelete?: () => void;
    onOpen?: () => void;
    onEdit?: () => void;
    onCancel?: () => void;
  };
  responseProps: ResponseProps;
  value?: {
    filename: string;
    ID: string;
    thumbnail: string;
  };
  categoryName: string;
  createTime: string;
  createdBy: string;
  createdByName: string;
  links: AttachmentLinks;
  name: string;
  meta?: ReactElement;
}

export interface ReduxAttachments {
  ID?: string;
  pzInsKey?: string;
  FileName: string;
  Category: string;
  MimeType?: string;
  FileExtension: string;
  error: string | null;
  localAttachment: boolean;
  thumbnail?: string;
  fileIndex?: number;
  instruction?: string;
}

export interface PageInstructionOptions {
  allowMultiple: boolean;
  isMultiAttachmentInInlineEditTable: boolean;
  attachmentCount: number;
  insertPageInstruction: boolean;
  deletePageInstruction: boolean;
  deleteIndex: number;
  insertRedux: boolean;
  isOldAttachment: boolean;
  deleteRedux: boolean;
}
