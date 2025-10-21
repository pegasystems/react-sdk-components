import React, { forwardRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { FormControl, FormHelperText, InputLabel } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import { useAfterInitialEffect, useConsolidatedRef, useUID } from '../../../hooks';
import { theme } from '../../../theme';

const useStyles = makeStyles(() => ({
  fieldLabel: {
    position: 'relative',
    transform: 'translate(0, 0px) scale(1)',
    marginBottom: '5px',
    color: theme.palette.text.secondary
  }
}));

interface RichTextEditorProps {
  id?: string;
  defaultValue: string;
  label: string;
  labelHidden: boolean;
  info: string;
  testId: string;
  placeholder: string;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
  error: boolean;
  onBlur: React.EventHandler<any>;
  onChange: React.EventHandler<any>;
}

const RichTextEditor = forwardRef(function RichTextEditor(props: RichTextEditorProps, ref) {
  const classes = useStyles();
  const uid = useUID();
  const { id = uid, defaultValue, label, labelHidden, info, testId, placeholder, disabled, required, readOnly, error, onBlur, onChange } = props;

  const editorRef: any = useConsolidatedRef(ref);
  let richTextComponent: any = null;

  useAfterInitialEffect(() => {
    editorRef?.current.mode.set(readOnly || disabled ? 'readonly' : 'design');
  }, [readOnly, disabled]);

  const filePickerCallback = cb => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');

    input.addEventListener('change', (e: any) => {
      const file = e.target.files[0];

      const reader: any = new FileReader();
      reader.addEventListener('load', () => {
        /*
          Note: Now we need to register the blob in TinyMCEs image blob
          registry. In the next release this part hopefully won't be
          necessary, as we are looking to handle it internally.
        */
        const blobId = `blobid${new Date().getTime()}`;
        const blobCache = editorRef.current.editorUpload.blobCache;
        const base64 = reader.result.split(',')[1];
        const blobInfo = blobCache.create(blobId, file, base64);
        blobCache.add(blobInfo);

        /* call the callback and populate the Title field with the file name */
        cb(blobInfo.blobUri(), { title: file.name });
      });
      reader.readAsDataURL(file);
    });

    input.click();
  };

  if (readOnly) {
    const value = defaultValue || '--';

    richTextComponent = <div key={id} id={id} className='readonly-richtext-editor' dangerouslySetInnerHTML={{ __html: value }} />;
  } else {
    richTextComponent = (
      <Editor
        tinymceScriptSrc='tinymce/tinymce.min.js'
        onInit={(_evt, editor) => {
          editorRef.current = editor;
        }}
        id={id}
        initialValue={defaultValue}
        disabled={disabled}
        init={{
          skin: 'oxide-dark', // or 'oxide' for light theme
          // ...other TinyMCE config...
          content_style: `
        body {
          font-family: ${theme.typography.fontFamily};
          font-size: ${theme.typography.fontSize}px;
          color: ${theme.palette.text.primary};
          background: ${theme.palette.background.paper};
        }
        a { color: ${theme.palette.primary.main}; }
        h1, h2, h3, h4, h5, h6 { color: ${theme.palette.text.primary}; font-family: ${theme.typography.fontFamily}; }
        blockquote { color: ${theme.palette.text.secondary}; border-left: 4px solid ${theme.palette.primary.light}; padding-left: 8px; }
        ul, ol { color: ${theme.palette.text.primary}; }
        input, textarea, select {
          background: ${theme.palette.background.paper};
          color: ${theme.palette.text.primary};
          border: 1px solid ${theme.palette.divider};
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 1em;
          font-family: inherit;
      }
      /* Add more styles as needed */
    `,
          placeholder,
          menubar: false,
          statusbar: false,
          min_height: 130,
          plugins: ['lists', 'advlist', 'autolink', 'image', 'link', 'autoresize'],
          autoresize_bottom_margin: 0,
          toolbar: disabled ? false : 'blocks | bold italic strikethrough | bullist numlist outdent indent | link image',
          toolbar_location: 'bottom',
          // content_style: 'body { font-family:Helvetica, Arial,sans-serif; font-size:14px }',
          branding: false,
          paste_data_images: true,
          file_picker_types: 'image',
          file_picker_callback: filePickerCallback
        }}
        onBlur={onBlur}
        onEditorChange={onChange}
      />
    );
  }

  return (
    <FormControl variant='standard' data-test-id={testId} error={error} required={required}>
      {!labelHidden && (
        <InputLabel id='demo-simple-select-error-label' className={classes.fieldLabel}>
          {label}
        </InputLabel>
      )}
      {richTextComponent}
      {info && <FormHelperText>{info}</FormHelperText>}
    </FormControl>
  );
});

export default RichTextEditor;
