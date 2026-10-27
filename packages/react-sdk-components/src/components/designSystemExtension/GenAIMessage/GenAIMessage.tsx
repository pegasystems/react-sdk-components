import { useEffect, useMemo } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import makeStyles from '@mui/styles/makeStyles';

import { getComponentFromMap } from '../../../bridge/helpers/sdk_component_map';
import { StreamingContext, type StreamingContextProps } from '../../helpers/StreamingContext';
import { isCoachMessage, isUserMessage } from '../GenAICoachContent/GenAICoach.utils';
import type { GenAIMessageProps, MarkdownMap } from '../GenAICoachContent/GenAICoach.types';

const useStyles = makeStyles(theme => ({
  coachMessage: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0)
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
  systemMessage: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(1, 0),
    textAlign: 'center'
  },
  stopped: {
    fontStyle: 'italic'
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

interface CoachLoadingContentProps {
  message?: string;
  markdownMap?: MarkdownMap;
  progressSteps?: string[];
  progressStepsCompleted?: number;
}

const LoadingContent = ({ message, markdownMap, progressSteps, progressStepsCompleted }: CoachLoadingContentProps) => {
  // Get emitted components from map (so we can get any override that may exist)
  const AgentRichTextViewer = getComponentFromMap('AgentRichTextViewer');
  const GenAIMessageProgress = getComponentFromMap('GenAIMessageProgress');

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  if (!progressSteps?.length) {
    return <GenAIMessageProgress messages={message ? [message] : undefined} />;
  }

  if (message) {
    return (
      <>
        <AgentRichTextViewer content={message} markdownMap={markdownMap} />
        <CircularProgress size={14} aria-label={localizedVal('Generating response', localeCategory)} />
      </>
    );
  }

  return <GenAIMessageProgress messages={progressSteps} completedSteps={progressStepsCompleted} />;
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
    // so streaming is done as soon as all chunks are received.
    if (isStreamingMessage && isCoachMessage(props) && props.onStreamingUpdate) {
      props.onStreamingUpdate(!!allChunksReceived);
    }
  }, [isStreamingMessage, allChunksReceived]);

  const streamingContext: StreamingContextProps = useMemo(() => {
    return { isStreamingMessage, isStreamingInProgress: isCoachMessage(props) && props.loading };
  }, [isStreamingMessage, props]);

  if (isCoachMessage(props)) {
    const { id: messageId, isCustom, suggestions, onSend, loading, error, feedback, markdownMap, progressSteps, progressStepsCompleted } = props;

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
          !!(loading || progressSteps?.length) && (
            <GenAIMessageProgress
              messages={progressSteps?.length ? progressSteps : undefined}
              completedSteps={progressSteps?.length ? progressStepsCompleted : undefined}
            />
          )
        )}
      </>
    );

    return (
      <li className={classes.coachMessage}>
        {/* Streaming loader and content */}
        {streamingContent}

        {loading || error ? (
          <>
            {loading && !isStreamingMessage && (
              <LoadingContent
                message={message}
                markdownMap={markdownMap}
                progressSteps={progressSteps}
                progressStepsCompleted={progressStepsCompleted}
              />
            )}
            {error && <Alert severity='error'>{error}</Alert>}
          </>
        ) : (
          <>
            {/* Non streaming content */}
            {!isStreamingMessage && message && <AgentRichTextViewer content={message} markdownMap={markdownMap} />}

            {!isCustom && feedback && (
              <Box className={classes.actions}>
                <GenAIMessageFeedback messageId={messageId} feedback={feedback} />
              </Box>
            )}

            {suggestions && suggestions.length > 0 && (
              <Box className={classes.suggestions}>
                {suggestions.map(({ id, message: prompt, selected }) => {
                  return (
                    <Button
                      key={id}
                      size='small'
                      className={classes.suggestion}
                      variant={selected ? 'contained' : 'outlined'}
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

  if (props.from === 'system') {
    const displayMessage = props.stopped && !message ? localizedVal('Response stopped', localeCategory) : message;
    // The case is shown as text (label in the message, then its ID); there is no link, as in the source.
    const caseId = props.caseInfo?.id ? props.caseInfo.id.trim().split(/\s+/).pop() : undefined;
    return (
      <li className={classes.systemMessage}>
        <Typography variant='caption' color='text.secondary' className={props.stopped ? classes.stopped : undefined}>
          {displayMessage}
          {caseId ? ` (${caseId})` : null}
        </Typography>
      </li>
    );
  }

  return null;
}
