import { Fragment, memo, useMemo, type ReactNode } from 'react';
import { marked, type Token, type Tokens } from 'marked';
import { Divider, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import type { MarkdownMap } from '../GenAICoachContent/GenAICoach.types';

// AgentRichTextViewer is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
interface AgentRichTextViewerProps {
  // If any, enter additional props that only exist on this component
  content: string;
  markdownMap?: MarkdownMap;
}

const SAFE_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

const isSafeHref = (href: string): boolean => {
  try {
    return SAFE_LINK_PROTOCOLS.includes(new URL(href, window.location.origin).protocol);
  } catch {
    return false;
  }
};

const useStyles = makeStyles(theme => ({
  root: {
    overflowWrap: 'anywhere',
    '& > :first-child': { marginTop: 0 },
    '& > :last-child': { marginBottom: 0 }
  },
  paragraph: {
    margin: theme.spacing(0, 0, 1),
    whiteSpace: 'pre-line'
  },
  heading: {
    margin: theme.spacing(1.5, 0, 1),
    fontWeight: 600
  },
  list: {
    margin: theme.spacing(0, 0, 1),
    paddingInlineStart: theme.spacing(3)
  },
  blockquote: {
    margin: theme.spacing(0, 0, 1),
    paddingInlineStart: theme.spacing(1.5),
    borderInlineStart: `0.25rem solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary
  },
  codeBlock: {
    margin: theme.spacing(1, 0),
    padding: theme.spacing(1.5),
    overflowX: 'auto',
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    whiteSpace: 'pre'
  },
  inlineCode: {
    padding: '0.0625rem 0.25rem',
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    fontSize: '0.875em'
  },
  table: {
    margin: theme.spacing(1, 0),
    maxWidth: '100%',
    overflowX: 'auto'
  }
}));

/**
 * Renders agent markdown: the Cosmos `AgentRichTextViewer` (a `RichTextViewer` in markdown mode).
 * The markdown is parsed with `marked.lexer()` and the tokens are rendered as React elements, so no HTML
 * string is ever injected; raw HTML in the markdown is shown as plain text.
 * `markdownMap` maps a token type to a function returning the component that renders that token instead.
 * Memoised so completed messages are not re-rendered while another message streams.
 */
function AgentRichTextViewer(props: AgentRichTextViewerProps) {
  const { content, markdownMap } = props;
  const classes = useStyles();

  const tokens = useMemo(() => marked.lexer(content ?? ''), [content]);

  const renderTokens = (tokenList?: Token[]): ReactNode => tokenList?.map((token, index) => <Fragment key={index}>{renderToken(token)}</Fragment>);

  const renderToken = (token: Token): ReactNode => {
    const Override = markdownMap?.[token.type]?.(token);
    if (Override) {
      return <Override token={token} />;
    }

    switch (token.type) {
      case 'space':
      case 'def':
        return null;
      case 'paragraph':
        return (
          <Typography component='p' variant='body2' className={classes.paragraph}>
            {renderTokens((token as Tokens.Paragraph).tokens)}
          </Typography>
        );
      case 'heading': {
        // Headings are capped so agent content never outranks the panel's own heading.
        const level = Math.min((token as Tokens.Heading).depth + 2, 6);
        return (
          <Typography component={`h${level}` as 'h3'} variant='subtitle1' className={classes.heading}>
            {renderTokens((token as Tokens.Heading).tokens)}
          </Typography>
        );
      }
      case 'text': {
        const textToken = token as Tokens.Text;
        return textToken.tokens ? renderTokens(textToken.tokens) : textToken.text;
      }
      case 'escape':
      case 'html':
        return (token as Tokens.Escape | Tokens.HTML).text;
      case 'strong':
        return <strong>{renderTokens((token as Tokens.Strong).tokens)}</strong>;
      case 'em':
        return <em>{renderTokens((token as Tokens.Em).tokens)}</em>;
      case 'del':
        return <del>{renderTokens((token as Tokens.Del).tokens)}</del>;
      case 'codespan':
        return <code className={classes.inlineCode}>{(token as Tokens.Codespan).text}</code>;
      case 'br':
        return <br />;
      case 'link': {
        const { href, text } = token as Tokens.Link;
        if (!isSafeHref(href)) return text;
        return (
          <Link href={href} target='_blank' rel='noopener noreferrer'>
            {text}
          </Link>
        );
      }
      case 'image':
        // Images are not loaded; the alternative text is shown instead.
        return (token as Tokens.Image).text;
      case 'code':
        return (
          <pre className={classes.codeBlock}>
            <code>{(token as Tokens.Code).text}</code>
          </pre>
        );
      case 'blockquote':
        return <blockquote className={classes.blockquote}>{renderTokens((token as Tokens.Blockquote).tokens)}</blockquote>;
      case 'hr':
        return <Divider sx={{ my: 1 }} />;
      case 'list': {
        const listToken = token as Tokens.List;
        const items = listToken.items.map((item, index) => (
          <li key={index}>
            {item.task ? `${item.checked ? '\u2611' : '\u2610'} ` : null}
            {renderTokens(item.tokens)}
          </li>
        ));
        return listToken.ordered ? (
          <ol className={classes.list} start={typeof listToken.start === 'number' ? listToken.start : undefined}>
            {items}
          </ol>
        ) : (
          <ul className={classes.list}>{items}</ul>
        );
      }
      case 'table': {
        const tableToken = token as Tokens.Table;
        return (
          <TableContainer className={classes.table}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  {tableToken.header.map((cell, index) => (
                    <TableCell key={index} align={tableToken.align[index] ?? undefined}>
                      {renderTokens(cell.tokens)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableToken.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} align={tableToken.align[cellIndex] ?? undefined}>
                        {renderTokens(cell.tokens)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      }
      default:
        return 'text' in token && typeof token.text === 'string' ? token.text : null;
    }
  };

  return <div className={classes.root}>{renderTokens(tokens)}</div>;
}

export default memo(AgentRichTextViewer);
