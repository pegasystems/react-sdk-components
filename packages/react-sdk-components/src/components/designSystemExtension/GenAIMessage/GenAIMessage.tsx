import { useEffect, useMemo, type ReactNode } from 'react';
import { Alert, Avatar, Box, Button, Chip, CircularProgress, IconButton, Tooltip } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import makeStyles from '@mui/styles/makeStyles';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { StreamingContext, type StreamingContextProps } from '../../helpers/StreamingContext';
import { isCoachMessage, isUserMessage } from '../GenAICoachContent/GenAICoach.utils';
import type { Action, GenAIMessageProps } from '../GenAICoachContent/GenAICoach.types';

// MUI icons for the icon names of the message actions.
const actionIcons: Record<string, ReactNode> = {
  copy: <ContentCopyIcon fontSize='small' />
};

const useStyles = makeStyles(theme => ({
  coachMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1, 0)
  },
  // The agent avatar: the theme's primary color on a subtle circle with a faint ring.
  coachAvatar: {
    width: '2rem',
    height: '2rem',
    color: theme.palette.primary.main,
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
    // The text is shown as it arrives (Constellation's typing animation is not ported),
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
          <AutoAwesomeIcon />
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
