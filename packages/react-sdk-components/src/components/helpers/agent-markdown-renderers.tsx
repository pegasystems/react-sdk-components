import { type ComponentType, type MouseEvent, useContext } from 'react';
import type { Tokens } from 'marked';
import { Box, CircularProgress, Link, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { SdkConfigAccess } from '@pega/auth/lib/sdk-auth-manager';

import type { CaseDetails } from '../designSystemExtension/GenAICoachContent/GenAICoach.types';
import { StreamingContext } from './StreamingContext';
import {
  type CoachPConnectGetter,
  type ResolvedCaseLink,
  hasCaseIdentifierQueryParams,
  parseCaseLink,
  resolveCaseKeysFromLink,
  resolveCaseOpenStrategy
} from './agent-inline-edit-utils';

/** Returns the cases created or opened in the conversation. */
export type ConversationCasesGetter = () => CaseDetails[];

const useStyles = makeStyles(theme => ({
  codeBlock: {
    margin: theme.spacing(1, 0),
    padding: theme.spacing(1.5),
    overflowX: 'auto',
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    whiteSpace: 'pre'
  }
}));

/**
 * Custom `code` renderer to interpret AI generated code blocks and showing the appropriate content.
 * The chart and insight renderers of the source are not ported; code is shown as a code block.
 * @component
 */
const CoachCodeRenderer = ({ token }: { token: Tokens.Code }) => {
  const streamingContext = useContext(StreamingContext);
  const classes = useStyles();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  if (streamingContext?.isStreamingMessage && streamingContext.isStreamingInProgress) {
    return (
      <Box display='flex' alignItems='center' gap={1} role='status'>
        <CircularProgress size={16} />
        <Typography variant='body2'>{localizedVal('Preparing content', localeCategory)}</Typography>
      </Box>
    );
  }

  return (
    <pre className={classes.codeBlock}>
      <code>{token.text}</code>
    </pre>
  );
};

const SAFE_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

const isSafeHref = (href: string): boolean => {
  try {
    return SAFE_LINK_PROTOCOLS.includes(new URL(href, window.location.origin).protocol);
  } catch {
    return false;
  }
};

// The agent links cases to the Pega portal of the Infinity server the application uses.
const isInfinityServerLink = (href: string): boolean => {
  try {
    const { infinityRestServerUrl } = SdkConfigAccess.getSdkConfigServer();

    return new URL(href, window.location.origin).origin === new URL(infinityRestServerUrl).origin;
  } catch {
    return false;
  }
};

const getLastPathSegment = (href: string): string => {
  try {
    const pathParts = new URL(href, window.location.origin).pathname.split('/').filter(Boolean);

    return pathParts.length > 0 ? decodeURIComponent(pathParts[pathParts.length - 1]).trim() : '';
  } catch {
    return '';
  }
};

const getWorkID = (caseKey: string) => caseKey.trim().split(/\s+/).pop();

/**
 * Resolves the case of the application a link points to, if it can be opened in the application.
 * openWorkByHandle needs the case key (`<class> <work ID>`); a link with only the work ID is matched
 * against the cases created or opened in the conversation.
 */
const resolveLinkedCase = (href: string, getConversationCases?: ConversationCasesGetter): { insKey: string; className: string } | undefined => {
  if (!hasCaseIdentifierQueryParams(href) && !isInfinityServerLink(href)) {
    return undefined;
  }

  const parsed = parseCaseLink(href);
  const fromLink = parsed ? resolveCaseKeysFromLink(parsed, href) : undefined;
  const linkedID = fromLink?.insKey?.trim() || getLastPathSegment(href);
  const conversationCase = linkedID ? getConversationCases?.().find(({ id }) => id === linkedID || getWorkID(id) === linkedID) : undefined;
  const resolved: ResolvedCaseLink | undefined = conversationCase
    ? {
        appName: parsed?.appName ?? '',
        caseTypeID: conversationCase.type,
        caseReferenceID: conversationCase.id,
        pegaServerUrl: parsed?.pegaServerUrl ?? '',
        insKey: conversationCase.id,
        className: conversationCase.type
      }
    : fromLink;

  const insKey = resolved?.insKey?.trim();
  if (!resolved?.className || !insKey || !/\s/.test(insKey) || resolveCaseOpenStrategy(resolved) !== 'native') {
    return undefined;
  }

  return { insKey, className: resolved.className };
};

/**
 * Custom `link` renderer to open markdown links in a new tab, except links to cases of the application.
 * @component
 */
const ExternalLink = ({
  token,
  getPConnect,
  getConversationCases
}: {
  token: Tokens.Link;
  getPConnect?: CoachPConnectGetter;
  getConversationCases?: ConversationCasesGetter;
}) => {
  const { href, text } = token;

  // Links with other protocols (for example javascript:) are shown as plain text.
  if (!isSafeHref(href)) {
    return <>{text}</>;
  }

  // Deviation from Constellation: a link to a case opens the case in the application, as the Pega portal
  // it points to is outside the application. Modified clicks keep the browser behavior.
  const handleClick = (e: MouseEvent) => {
    if (!getPConnect || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    const linkedCase = resolveLinkedCase(href, getConversationCases);
    if (!linkedCase) {
      return;
    }

    e.preventDefault();
    Promise.resolve(getPConnect().getActionsApi().openWorkByHandle(linkedCase.insKey, linkedCase.className)).catch((error: unknown) => {
      console.error(error);
    });
  };

  return (
    <Link href={href} target='_blank' rel='noopener noreferrer' onClick={handleClick}>
      {text}
    </Link>
  );
};

const createCoachLinkRenderer = (getPConnect?: CoachPConnectGetter, getConversationCases?: ConversationCasesGetter) => {
  return ({ token }: { token: Tokens.Link }) => <ExternalLink token={token} getPConnect={getPConnect} getConversationCases={getConversationCases} />;
};

/**
 * Wrapper component that strips JSON marker blocks from text tokens.
 * During streaming, partially-received markers (no end marker yet) are hidden;
 * any prose before the marker is still rendered.
 */
const CoachTextRenderer = ({ token }: { token: Tokens.Text }) => {
  const streamingContext = useContext(StreamingContext);
  const isStreaming = streamingContext?.isStreamingMessage && streamingContext.isStreamingInProgress;

  // Strip complete JSON blocks containing followUpQuestions (start + end marker present)
  let text = token.text;
  if (text.includes('followUpQuestions') && text.includes('###JSON_ENDS_HERE')) {
    text = text.replace(/###JSON_STARTS_HERE[\s\S]*?###JSON_ENDS_HERE/g, '');
  }

  // While streaming, the end marker may not have arrived yet — strip partial block from start marker onward
  if (isStreaming) {
    const startIdx = text.indexOf('###JSON_STARTS');
    if (startIdx !== -1) {
      text = text.substring(0, startIdx);
    }
  }

  return text ? <>{text}</> : null;
};

/** Markdown overrides for GenAI coach */
export const createAgentMarkdownMap = (options?: { getPConnect?: CoachPConnectGetter; getConversationCases?: ConversationCasesGetter }) => {
  const CoachLinkRenderer = createCoachLinkRenderer(options?.getPConnect, options?.getConversationCases);

  return {
    code: () => CoachCodeRenderer,
    link: () => CoachLinkRenderer,
    text: (token: Tokens.Text): ComponentType<{ token: Tokens.Text }> | undefined => {
      // Only override for JSON marker tokens;
      // It preserves the default renderer.
      if (token.text.includes('###JSON_STARTS')) {
        return CoachTextRenderer;
      }
      return undefined;
    }
  };
};

const agentMarkdownMap = createAgentMarkdownMap();

export default agentMarkdownMap;
