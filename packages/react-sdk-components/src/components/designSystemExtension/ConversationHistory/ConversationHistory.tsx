import { useEffect, useId, useRef } from 'react';
import clsx from 'clsx';
import { Alert, Box, CircularProgress, IconButton, List, ListItemButton, ListItemText, ListSubheader, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import makeStyles from '@mui/styles/makeStyles';

import type { ConversationHistoryProps } from '../GenAICoachContent/GenAICoach.types';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0
  },
  inFullPage: {
    borderInlineEnd: `0.0625rem solid ${theme.palette.divider}`
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(1, 2)
  },
  list: {
    flexGrow: 1,
    overflowY: 'auto',
    paddingTop: 0
  },
  groupHeader: {
    lineHeight: 2.5,
    backgroundColor: theme.palette.background.paper
  },
  state: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2)
  }
}));

// ConversationHistory is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
export default function ConversationHistory(props: ConversationHistoryProps) {
  const { data = [], onDismiss, loading = false, loadMore, inFullPage = false, onItemClick, selectedItemId, error } = props;
  const classes = useStyles();
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';
  // The panel and its fullscreen copy can both show the history, so element ids are unique per instance.
  const idPrefix = useId();

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const totalConversations = data.reduce((sum, section) => sum + section.conversations.length, 0);

  // Loads the next page when the end of the list is in view, checked again after each page arrives.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !loadingRef.current) {
        loadMoreRef.current?.();
      }
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [totalConversations, loading]);

  useEffect(() => {
    if (closeButtonRef.current) closeButtonRef.current.focus();
  }, []);

  const loadingOrEmptyElement = loading ? (
    <Box className={classes.state}>
      <CircularProgress size={24} aria-label={localizedVal('Loading…', localeCategory)} />
    </Box>
  ) : (
    <Box className={classes.state}>
      <Typography variant='body2' color='text.secondary'>
        {localizedVal('No conversations found', localeCategory)}
      </Typography>
    </Box>
  );

  const renderComponent =
    data.length > 0 ? (
      <List className={classes.list} aria-label={localizedVal('Your chats', localeCategory)}>
        {data.map(item => {
          return (
            <li key={item.id}>
              <List disablePadding aria-labelledby={`${idPrefix}-section-${item.id}`}>
                <ListSubheader id={`${idPrefix}-section-${item.id}`} className={classes.groupHeader}>
                  {item.section}
                </ListSubheader>
                {item.conversations.map(conversation => {
                  const activeElement = selectedItemId === conversation.id;
                  return (
                    <ListItemButton
                      key={conversation.id}
                      id={`${idPrefix}-${conversation.id}`}
                      selected={activeElement}
                      aria-current={activeElement ? 'true' : undefined}
                      onClick={() => {
                        onItemClick?.(conversation.id);
                      }}
                    >
                      <ListItemText primary={conversation.title} primaryTypographyProps={{ noWrap: true, variant: 'body2' }} />
                    </ListItemButton>
                  );
                })}
              </List>
            </li>
          );
        })}
        <li ref={sentinelRef} aria-hidden={!loading}>
          {loading && loadingOrEmptyElement}
        </li>
      </List>
    ) : (
      loadingOrEmptyElement
    );

  return (
    <Box className={clsx(classes.root, inFullPage && classes.inFullPage)}>
      <Box className={classes.header}>
        <Typography variant='h6' component='h2'>
          {localizedVal('Your chats', localeCategory)}
        </Typography>
        <IconButton size='small' aria-label={localizedVal('Close', localeCategory)} onClick={onDismiss} ref={closeButtonRef}>
          <CloseIcon fontSize='small' />
        </IconButton>
      </Box>

      {error ? (
        <Alert severity='error' sx={{ m: 1 }}>
          {error}
        </Alert>
      ) : (
        renderComponent
      )}
    </Box>
  );
}
