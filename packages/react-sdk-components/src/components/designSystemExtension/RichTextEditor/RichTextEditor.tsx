import React, { forwardRef, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { FormControl, FormHelperText, FormLabel, useTheme, IconButton, Box } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  StrikethroughS,
  FormatListBulleted,
  FormatListNumbered,
  FormatIndentDecrease,
  FormatIndentIncrease,
  InsertLink,
  Image as ImageIcon
} from '@mui/icons-material';
import makeStyles from '@mui/styles/makeStyles';
import { useAfterInitialEffect, useConsolidatedRef, useUID } from '../../../hooks';

const useStyles = makeStyles(theme => ({
  fieldLabel: {
    position: 'relative',
    transform: 'translate(0, 0px) scale(1)',
    marginBottom: '5px',
    color: theme.palette.text.secondary
  },
  editorWrapper: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 4,
    minHeight: 130,
    '& .ProseMirror': {
      padding: '8px 12px',
      minHeight: 100,
      outline: 'none',
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize,
      color: theme.palette.text.primary,
      '& p.is-editor-empty:first-child::before': {
        color: theme.palette.text.secondary,
        opacity: 0.7,
        content: 'attr(data-placeholder)',
        float: 'left',
        height: 0,
        pointerEvents: 'none'
      },
      '& a': { color: theme.palette.primary.main },
      '& h1, & h2, & h3, & h4, & h5, & h6': { color: theme.palette.text.primary },
      '& blockquote': {
        color: theme.palette.text.secondary,
        borderLeft: `4px solid ${theme.palette.primary.light}`,
        paddingLeft: 8
      },
      '& ul, & ol': {
        paddingLeft: 24
      }
    }
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    padding: '4px 8px',
    borderTop: `1px solid ${theme.palette.divider}`
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
  const theme = useTheme();
  const classes = useStyles();
  const uid = useUID();
  const { id = uid, defaultValue, label, labelHidden, info, testId, placeholder, disabled, required, readOnly, error, onBlur, onChange } = props;

  const editorRef: any = useConsolidatedRef(ref);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false }), Image.configure({ allowBase64: true }), Placeholder.configure({ placeholder })],
    content: defaultValue || '',
    editable: !readOnly && !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    onBlur: ({ event }) => {
      onBlur?.(event);
    }
  });

  useAfterInitialEffect(() => {
    editor?.setEditable(!readOnly && !disabled);
  }, [readOnly, disabled]);

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        editor
          .chain()
          .focus()
          .setImage({ src: reader.result as string })
          .run();
      });
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [editor]
  );

  const handleLinkInsert = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;

    // Restore selection lost by the prompt dialog
    editor.chain().focus().setTextSelection({ from, to }).run();

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else if (from === to) {
      // No text selected — insert URL as linked text
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] })
        .run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (readOnly) {
    const value = defaultValue || '--';
    return (
      <FormControl variant='standard' data-test-id={testId} error={error} required={required} fullWidth>
        {!labelHidden && (
          <FormLabel htmlFor={id} className={classes.fieldLabel}>
            {label}
          </FormLabel>
        )}
        <div key={id} id={id} className='readonly-richtext-editor' dangerouslySetInnerHTML={{ __html: value }} />
        {info && <FormHelperText>{info}</FormHelperText>}
      </FormControl>
    );
  }

  return (
    <FormControl variant='standard' data-test-id={testId} error={error} required={required} fullWidth>
      {!labelHidden && (
        <FormLabel htmlFor={id} className={classes.fieldLabel}>
          {label}
        </FormLabel>
      )}
      <Box className={classes.editorWrapper} sx={{ background: theme.palette.background.paper }}>
        <EditorContent editor={editor} id={id} />
        {!disabled && (
          <div className={classes.toolbar}>
            <IconButton
              size='small'
              onClick={() => editor?.chain().focus().toggleBold().run()}
              color={editor?.isActive('bold') ? 'primary' : 'default'}
            >
              <FormatBold fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              color={editor?.isActive('italic') ? 'primary' : 'default'}
            >
              <FormatItalic fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              color={editor?.isActive('strike') ? 'primary' : 'default'}
            >
              <StrikethroughS fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              color={editor?.isActive('bulletList') ? 'primary' : 'default'}
            >
              <FormatListBulleted fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              color={editor?.isActive('orderedList') ? 'primary' : 'default'}
            >
              <FormatListNumbered fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={() => editor?.chain().focus().liftListItem('listItem').run()}>
              <FormatIndentDecrease fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={() => editor?.chain().focus().sinkListItem('listItem').run()}>
              <FormatIndentIncrease fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={handleLinkInsert} color={editor?.isActive('link') ? 'primary' : 'default'}>
              <InsertLink fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={handleImageUpload}>
              <ImageIcon fontSize='small' />
            </IconButton>
          </div>
        )}
      </Box>
      <input ref={fileInputRef} type='file' accept='image/*' style={{ display: 'none' }} onChange={onFileChange} />
      {info && <FormHelperText>{info}</FormHelperText>}
    </FormControl>
  );
});

export default RichTextEditor;
