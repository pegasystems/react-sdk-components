import { useEffect, useMemo, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const baseDuration = 900;

// GenAIMessageProgress is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
export default function GenAIMessageProgress() {
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  const progressMessages = useMemo(
    () => [
      { message: localizedVal('Thinking', localeCategory), duration: baseDuration },
      { message: localizedVal('Analyzing data sources', localeCategory), duration: baseDuration },
      { message: localizedVal('Generating response', localeCategory), duration: baseDuration * 3 },
      { message: localizedVal('Double checking results', localeCategory), duration: baseDuration * 4 },
      { message: localizedVal('Finalizing response', localeCategory), duration: baseDuration * 5 },
      { message: localizedVal('Double checking results', localeCategory), duration: baseDuration * 7 },
      { message: localizedVal('Analyzing data sources', localeCategory), duration: baseDuration * 9 },
      { message: localizedVal('Finalizing response', localeCategory), duration: baseDuration * 10 }
    ],
    []
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextMessage = (index: number) => {
      if (index >= progressMessages.length - 1) return;

      const currentMessage = progressMessages[index];

      timeoutId = setTimeout(() => {
        setCurrentIndex(index + 1);
        scheduleNextMessage(index + 1);
      }, currentMessage.duration);
    };

    // Start with the first message and schedule the next one
    scheduleNextMessage(0);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [progressMessages]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant='body2'>{progressMessages[currentIndex].message}</Typography>
      <CircularProgress size={14} aria-hidden />
    </Box>
  );
}
