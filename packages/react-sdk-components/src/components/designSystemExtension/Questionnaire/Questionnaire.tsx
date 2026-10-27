import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import type { FormAnswer, OptionItem, Question, QuestionItemProps, QuestionnaireProps } from '../GenAICoachContent/GenAICoach.types';
import { getSelectedKeys } from '../GenAICoachContent/GenAICoach.utils';

const getLabel = (option: OptionItem): string => option.displayLabel ?? option.label;

const createAnswer = (question: Question): FormAnswer => ({
  value: getSelectedKeys(question),
  questionText: question.questionText
});

const buildInitialAnswers = (questions: Question[]): Record<string, FormAnswer> => Object.fromEntries(questions.map(q => [q.field, createAnswer(q)]));

const splitOptions = (optionItems: OptionItem[], maxInlineOptions: number): { inlineOptions: OptionItem[]; overflowOptions: OptionItem[] } => {
  if (optionItems.length <= maxInlineOptions) {
    return { inlineOptions: optionItems, overflowOptions: [] };
  }

  return {
    inlineOptions: optionItems.slice(0, maxInlineOptions - 1),
    overflowOptions: optionItems.slice(maxInlineOptions - 1)
  };
};

const QuestionItem = ({ question, answer, onChange }: QuestionItemProps) => {
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';

  const isSingleSelect = question.type === 'single';
  const maxInlineOptions = 5;

  const { inlineOptions, overflowOptions } = splitOptions(question.optionItems, maxInlineOptions);
  const hasOverflow = overflowOptions.length > 0;

  const overflowKeySet = useMemo(() => new Set(overflowOptions.map(o => o.key)), [overflowOptions]);

  const isSelected = (key: string) => answer.value.includes(key);

  const otherLabel = localizedVal('Other', localeCategory);

  // The "Other" list: a searchable MUI Autocomplete in place of the Cosmos ComboBox.
  const selectedOverflow = overflowOptions.filter(opt => isSelected(opt.key));

  const overflowComboBox = hasOverflow ? (
    <Box sx={{ mt: 1 }}>
      {isSingleSelect ? (
        <Autocomplete
          size='small'
          options={overflowOptions}
          getOptionLabel={getLabel}
          isOptionEqualToValue={(option, value) => option.key === value.key}
          value={selectedOverflow[0] ?? null}
          onChange={(_e, option) => {
            if (option) {
              onChange(question.field, option.key, true);
            } else {
              answer.value.filter(v => overflowKeySet.has(v)).forEach(key => onChange(question.field, key, false));
            }
          }}
          renderInput={params => <TextField {...params} label={otherLabel} />}
        />
      ) : (
        <Autocomplete
          multiple
          size='small'
          options={overflowOptions}
          getOptionLabel={getLabel}
          isOptionEqualToValue={(option, value) => option.key === value.key}
          value={selectedOverflow}
          onChange={(_e, options) => {
            const nextKeys = options.map(o => o.key);
            overflowOptions.forEach(opt => {
              const shouldSelect = nextKeys.includes(opt.key);
              if (shouldSelect !== isSelected(opt.key)) {
                onChange(question.field, opt.key, shouldSelect);
              }
            });
          }}
          renderInput={params => <TextField {...params} label={otherLabel} />}
        />
      )}
    </Box>
  ) : null;

  return (
    <FormControl component='fieldset' fullWidth>
      {/* The question text is the card heading; the legend repeats it for assistive technologies only. */}
      <Box
        component='legend'
        sx={{ position: 'absolute', width: '0.0625rem', height: '0.0625rem', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}
      >
        {question.questionText}
      </Box>
      {isSingleSelect ? (
        <RadioGroup name={question.field} value={answer.value.find(v => !overflowKeySet.has(v)) ?? ''}>
          {inlineOptions.map(option => (
            <FormControlLabel
              key={option.key}
              value={option.key}
              control={<Radio size='small' />}
              label={getLabel(option)}
              checked={isSelected(option.key)}
              onChange={() => onChange(question.field, option.key, true)}
            />
          ))}
        </RadioGroup>
      ) : (
        <FormGroup>
          {inlineOptions.map(option => (
            <FormControlLabel
              key={option.key}
              control={
                <Checkbox size='small' checked={isSelected(option.key)} onChange={e => onChange(question.field, option.key, e.target.checked)} />
              }
              label={getLabel(option)}
            />
          ))}
        </FormGroup>
      )}
      {overflowComboBox}
    </FormControl>
  );
};

// Questionnaire is one of the few components that does NOT have getPConnect.
//  So, no need to extend PConnProps
export default function Questionnaire(props: QuestionnaireProps) {
  const { data, onChange, onCancel } = props;
  const localizedVal = PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'GenAICoach';
  const questions = data.questions ?? [];
  const totalSteps = questions.length;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, FormAnswer>>(() => buildInitialAnswers(questions));

  // Resync local answers/step whenever a new questionnaire arrives. Relying only on the parent's
  // `key` remount isn't enough here, since two different conversations can share the same field
  // names, which would otherwise reuse this instance and carry over the previous chat's selections.
  useEffect(() => {
    setCurrentStep(0);
    setAnswers(buildInitialAnswers(questions));
  }, [questions]);

  const handleChange = useCallback(
    (field: string, key: string, selected: boolean) => {
      setAnswers(prev => {
        const question = questions.find(q => q.field === field);
        const currentValues = prev[field]?.value ?? [];
        let updatedValues: string[];

        if (question?.type === 'single') {
          updatedValues = selected ? [key] : [];
        } else {
          updatedValues = selected ? [...currentValues, key] : currentValues.filter(v => v !== key);
        }

        const nextAnswers = {
          ...prev,
          [field]: {
            questionText: question?.questionText ?? prev[field]?.questionText ?? '',
            value: updatedValues
          }
        };

        onChange(nextAnswers);

        return nextAnswers;
      });
    },
    [onChange, questions]
  );

  if (totalSteps === 0) return null;

  const activeQuestion = questions[currentStep];
  const activeAnswer = answers[activeQuestion.field] ?? createAnswer(activeQuestion);
  const isMultiStep = totalSteps > 1;

  return (
    <Card variant='outlined' sx={{ mb: 1 }}>
      <CardHeader
        sx={{ pb: 0 }}
        title={
          <Typography variant='subtitle2' component='h3'>
            {activeQuestion.questionText}
          </Typography>
        }
        action={
          <IconButton size='small' onClick={onCancel} aria-label={localizedVal('Dismiss', localeCategory)}>
            <CloseIcon fontSize='small' />
          </IconButton>
        }
      />

      <CardContent sx={{ py: 1 }}>
        <QuestionItem key={activeQuestion.field} question={activeQuestion} answer={activeAnswer} onChange={handleChange} />
      </CardContent>

      {isMultiStep && (
        <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
          <IconButton
            size='small'
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0}
            aria-label={localizedVal('Previous', localeCategory)}
          >
            <ChevronLeftIcon fontSize='small' />
          </IconButton>

          <Typography variant='body2' color='text.secondary'>
            {localizedVal('{1} of {2}', localeCategory)
              .replace('{1}', String(currentStep + 1))
              .replace('{2}', String(totalSteps))}
          </Typography>

          <IconButton
            size='small'
            onClick={() => setCurrentStep(s => s + 1)}
            disabled={currentStep === totalSteps - 1}
            aria-label={localizedVal('Next', localeCategory)}
          >
            <ChevronRightIcon fontSize='small' />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
}
