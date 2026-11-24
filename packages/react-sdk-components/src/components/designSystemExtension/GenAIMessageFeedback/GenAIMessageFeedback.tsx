import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Tooltip } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';

import type { MessageFeedbackProps, Reaction } from '../GenAICoachContent/GenAICoach.types';

// GenAIMessageFeedback is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
export default function GenAIMessageFeedback(props: MessageFeedbackProps) {
  const { messageId, feedback } = props;
  const {
    reaction,
    feedbackText = '',
    allowFeedbackResubmission = false,
    promptFeedbackOn = 'disliked',
    onReaction,
    onFeedbackComplete
  } = feedback ?? {};

  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  const [feedbackVal, setFeedbackVal] = useState(feedbackText);
  const [showDialog, setShowDialog] = useState(false);

  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const dislikeButtonRef = useRef<HTMLButtonElement>(null);
  const shouldOpenDialogRef = useRef(false);
  const [iconEl, setIconEl] = useState<HTMLDivElement | null>(null);

  const isLikeActive = reaction === 'liked';
  const isDislikeActive = reaction === 'disliked';

  const goodResponse = localizedVal('Good response', localeCategory);
  const badResponse = localizedVal('Bad response', localeCategory);

  const needsDialog = (reactionType: Reaction) => {
    switch (promptFeedbackOn) {
      case 'disliked':
        return reactionType === 'disliked';
      case 'liked':
        return reactionType === 'liked';
      case 'both':
        return true;
      default:
        return false;
    }
  };

  const handleReactionClick = useCallback(
    (reactionType: Reaction) => {
      if (reaction === reactionType) {
        if (allowFeedbackResubmission) {
          onReaction?.(messageId, undefined);
        }

        return;
      }

      onReaction?.(messageId, reactionType);

      if (needsDialog(reactionType)) {
        if (reaction !== reactionType) {
          setFeedbackVal('');
        } else {
          setFeedbackVal(feedbackText);
        }

        if (!allowFeedbackResubmission) {
          shouldOpenDialogRef.current = true;
        } else {
          setShowDialog(true);
        }
      }
    },
    [reaction, feedbackText, allowFeedbackResubmission, promptFeedbackOn, messageId, onReaction]
  );

  const closeDialog = useCallback(
    (comment?: string) => {
      setShowDialog(false);
      shouldOpenDialogRef.current = false;

      onFeedbackComplete?.(messageId, comment);
    },
    [onFeedbackComplete, messageId]
  );

  // Focus returns to the rating control once the dialog has closed.
  const restoreFocus = () => {
    if (!allowFeedbackResubmission && iconEl) {
      iconEl.focus();
      return;
    }
    (isLikeActive ? likeButtonRef.current : dislikeButtonRef.current)?.focus();
  };

  useEffect(() => {
    if (iconEl && shouldOpenDialogRef.current && !allowFeedbackResubmission) {
      setShowDialog(true);
      shouldOpenDialogRef.current = false;
    }
  }, [iconEl, allowFeedbackResubmission]);

  const feedbackDialog = (
    <Dialog
      open={showDialog}
      onClose={() => closeDialog()}
      disableRestoreFocus
      fullWidth
      maxWidth='xs'
      onKeyDown={e => e.stopPropagation()}
      slotProps={{ transition: { onExited: restoreFocus } }}
    >
      <DialogTitle>{localizedVal('Share feedback', localeCategory)}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          margin='dense'
          label={localizedVal('Add a comment (optional)', localeCategory)}
          value={feedbackVal}
          onChange={e => setFeedbackVal(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              closeDialog(feedbackVal);
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => closeDialog()}>{localizedVal('Cancel', localeCategory)}</Button>
        <Button variant='contained' onClick={() => closeDialog(feedbackVal)}>
          {localizedVal('Submit', localeCategory)}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const shouldShowIcon = !allowFeedbackResubmission && reaction;

  if (shouldShowIcon) {
    const selectedLabel = localizedVal('{1} selected', localeCategory).replace('{1}', isLikeActive ? goodResponse : badResponse);
    return (
      <>
        <Tooltip title={isLikeActive ? goodResponse : badResponse}>
          <Box ref={setIconEl} tabIndex={-1} role='status' aria-label={selectedLabel} sx={{ display: 'inline-flex', p: 0.5, color: 'primary.main' }}>
            {isLikeActive ? <ThumbUpIcon fontSize='small' aria-hidden /> : <ThumbDownIcon fontSize='small' aria-hidden />}
          </Box>
        </Tooltip>

        {feedbackDialog}
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title={goodResponse}>
          <IconButton
            size='small'
            aria-label={goodResponse}
            ref={likeButtonRef}
            onClick={() => handleReactionClick('liked')}
            aria-pressed={isLikeActive}
            color={isLikeActive ? 'primary' : 'default'}
          >
            {isLikeActive ? <ThumbUpIcon fontSize='small' /> : <ThumbUpOutlinedIcon fontSize='small' />}
          </IconButton>
        </Tooltip>

        <Tooltip title={badResponse}>
          <IconButton
            size='small'
            aria-label={badResponse}
            ref={dislikeButtonRef}
            onClick={() => handleReactionClick('disliked')}
            aria-pressed={isDislikeActive}
            color={isDislikeActive ? 'primary' : 'default'}
          >
            {isDislikeActive ? <ThumbDownIcon fontSize='small' /> : <ThumbDownOutlinedIcon fontSize='small' />}
          </IconButton>
        </Tooltip>
      </Box>

      {feedbackDialog}
    </>
  );
}
