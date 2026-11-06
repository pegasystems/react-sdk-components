import { useEffect, useMemo, type ReactNode } from 'react';
import { Alert, Avatar, Box, Button, Chip, CircularProgress, IconButton, SvgIcon, Tooltip, type PaletteMode } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import makeStyles from '@mui/styles/makeStyles';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { StreamingContext, type StreamingContextProps } from '../../helpers/StreamingContext';
import { isCoachMessage, isUserMessage } from '../GenAICoachContent/GenAICoach.utils';
import type { Action, GenAIMessageProps } from '../GenAICoachContent/GenAICoach.types';

// MUI icons for the Cosmos icon names of the message actions.
const actionIcons: Record<string, ReactNode> = {
  copy: <ContentCopyIcon fontSize='small' />
};

// The Cosmos `palette.ai` color of the light and dark themes.
const aiColor: Record<PaletteMode, string> = {
  light: '#681fc3',
  dark: '#d6bcf5'
};

// The Cosmos `polaris-solid` icon, inline so that it takes the theme color.
const PolarisSolidIcon = () => (
  <SvgIcon viewBox='0 0 25 25'>
    <path d='M24.5 12.501c-3.61.375-6.422 1.453-8.344 3.281-2.203 2.016-3.422 4.922-3.656 8.719-.47-3.844-1.781-6.75-3.89-8.766C6.64 13.907 3.921 12.828.5 12.5c3.61-.281 6.422-1.406 8.437-3.375C10.953 7.11 12.125 4.251 12.5.5c.281 4.172 1.64 7.266 4.125 9.281 2.016 1.594 4.64 2.485 7.875 2.72Zm-1.5-7.5c-.891.094-1.594.374-2.157.89-.515.516-.796 1.22-.843 2.11-.094-.89-.375-1.593-.843-2.062C18.64 5.424 17.937 5.096 17 5c.891-.046 1.547-.328 2.063-.796.515-.516.843-1.266.937-2.203.047.984.375 1.734.938 2.203.515.468 1.172.75 2.062.796ZM8 20c-.938.094-1.641.374-2.157.89-.515.47-.796 1.173-.843 2.11-.094-.984-.422-1.687-.984-2.203-.422-.422-1.125-.703-2.016-.796.797-.047 1.453-.282 1.922-.704.61-.469.984-1.219 1.078-2.297.047.797.281 1.5.75 2.062.469.516 1.219.844 2.25.938Z' />
  </SvgIcon>
);

const useStyles = makeStyles(theme => ({
  coachMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1, 0)
  },
  // The Cosmos agent avatar: the AI color on a subtle circle with a faint ring, in light and dark themes.
  coachAvatar: {
    width: '2rem',
    height: '2rem',
    color: aiColor[theme.palette.mode],
    backgroundColor: theme.palette.action.hover,
    boxShadow: `inset 0 0 0 0.0625rem ${theme.palette.divider}`,
    '& svg': {
      width: '50%',
      height: '50%'
    }
  },
  coachContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    // Centers the first line of text on the avatar.
    paddingTop: theme.spacing(0.75)
  },
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: theme.spacing(1, 0)
  },
  userBubble: {
    maxWidth: '85%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.action.selected
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1)
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: theme.spacing(1)
  },
  suggestion: {
    textTransform: 'none',
    textAlign: 'start'
  },
  attachments: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5)
  }
}));

const MessageAction = ({ id, text, icon, onClick }: Action) => {
  const visual = icon ? actionIcons[icon] : undefined;

  if (!visual) {
    return (
      <Button size='small' onClick={() => onClick?.(id)}>
        {text}
      </Button>
    );
  }

  return (
    <Tooltip title={text}>
      <IconButton size='small' aria-label={text} onClick={() => onClick?.(id)}>
        {visual}
      </IconButton>
    </Tooltip>
  );
};

// GenAIMessage is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps (its props are the message itself)
export default function GenAIMessage(props: GenAIMessageProps) {
  // Get emitted components from map (so we can get any override that may exist)
  const AgentRichTextViewer = getComponentFromMap('AgentRichTextViewer');
  const GenAIMessageProgress = getComponentFromMap('GenAIMessageProgress');
  const GenAIMessageFeedback = getComponentFromMap('GenAIMessageFeedback');

  const { message } = props;
  const classes = useStyles();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  const isStreamingMessage = isCoachMessage(props) && !!props.enableStreaming;
  const allChunksReceived = isCoachMessage(props) && props.allChunksReceived;

  useEffect(() => {
    // The text is shown as it arrives (the Cosmos typing animation is not ported),
    // so streaming is done as soon as all chunks are received. An answer that is no longer loading
    // does not report it again when it remounts (as when the fullscreen view opens).
    if (isStreamingMessage && isCoachMessage(props) && props.loading && props.onStreamingUpdate) {
      props.onStreamingUpdate(!!allChunksReceived);
    }
  }, [isStreamingMessage, allChunksReceived]);

  const streamingContext: StreamingContextProps = useMemo(() => {
    return { isStreamingMessage, isStreamingInProgress: isCoachMessage(props) && props.loading };
  }, [isStreamingMessage, props]);

  if (isCoachMessage(props)) {
    const { id: messageId, coachName, suggestions, onSend, loading, error, feedback, markdownMap, messageActions } = props;

    const streamingContent = isStreamingMessage && (
      <>
        {message ? (
          <>
            <StreamingContext.Provider value={streamingContext}>
              <AgentRichTextViewer content={message} markdownMap={markdownMap} />
            </StreamingContext.Provider>

            {loading && <CircularProgress size={14} aria-label={localizedVal('Generating response', localeCategory)} />}
          </>
        ) : (
          loading && <GenAIMessageProgress />
        )}
      </>
    );

    return (
      <li className={classes.coachMessage}>
        <Avatar className={classes.coachAvatar} {...(coachName ? { role: 'img', 'aria-label': coachName } : { 'aria-hidden': true })}>
          <PolarisSolidIcon />
        </Avatar>

        <Box className={classes.coachContent}>
          {/* Streaming loader and content */}
          {streamingContent}

          {loading || error ? (
            <>
              {loading && !isStreamingMessage && <GenAIMessageProgress />}
              {error && <Alert severity='error'>{error}</Alert>}
            </>
          ) : (
            <>
              {/* Non streaming content */}
              {!isStreamingMessage && message && <AgentRichTextViewer content={message} markdownMap={markdownMap} />}

              {(feedback || messageActions) && (
                <Box className={classes.actions}>
                  {feedback && <GenAIMessageFeedback messageId={messageId} feedback={feedback} />}

                  {messageActions?.items.map(action => (
                    <MessageAction key={action.id} {...action} />
                  ))}
                </Box>
              )}

              {suggestions && suggestions.length > 0 && (
                <Box className={classes.suggestions}>
                  {suggestions.map(({ id, message: prompt }) => {
                    return (
                      <Button
                        key={id}
                        size='small'
                        className={classes.suggestion}
                        variant='outlined'
                        onClick={onSend ? () => onSend({ id, message: prompt }) : undefined}
                      >
                        {prompt}
                      </Button>
                    );
                  })}
                </Box>
              )}
            </>
          )}
        </Box>
      </li>
    );
  }

  if (isUserMessage(props)) {
    return (
      <li className={classes.userRow}>
        <Box className={classes.userBubble}>
          {props.attachments && props.attachments.length > 0 && (
            <Box className={classes.attachments}>
              {props.attachments.map(attachment => {
                const name = attachment.displayText ?? attachment.name ?? '';
                return (
                  <Chip
                    key={attachment.id}
                    size='small'
                    variant='outlined'
                    icon={<AttachFileIcon />}
                    label={name}
                    onClick={attachment.onPreview}
                    aria-label={attachment.onPreview ? `${localizedVal('Download', localeCategory)} ${name}` : name}
                  />
                );
              })}
            </Box>
          )}
          {props.message && <AgentRichTextViewer content={props.message} />}
        </Box>
      </li>
    );
  }

  return null;
}
