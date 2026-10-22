import { Box, Button, Grid, Typography } from '@mui/material';
import { NavigateNext, VolumeUp } from '@mui/icons-material';
import { REPLAY_WORD_LABEL, type QuizQuestion } from './questions';

interface Props {
  question: QuizQuestion;
  answered: string | null;
  onAnswer: (answer: string) => void;
  onReplay: () => void;
  onNext?: () => void;
  nextLabel?: string;
  speechEnabled: boolean;
}

export default function QuestionCard({
  question,
  answered,
  onAnswer,
  onReplay,
  onNext,
  nextLabel = 'Next Question',
  speechEnabled,
}: Props) {
  const showResult = answered !== null;
  const isListen = question.type === 'listen';

  return (
    <Box sx={{ textAlign: 'center' }}>
      {question.emoji && (
        <Typography aria-hidden="true" sx={{ fontSize: '3rem', mb: 1 }}>{question.emoji}</Typography>
      )}
      <Typography
        data-testid="quiz-prompt"
        variant="h4"
        component="h2"
        sx={{ fontWeight: 700, mb: 2, overflowWrap: 'anywhere' }}
      >
        {question.prompt}
      </Typography>

      {isListen && !showResult && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<VolumeUp />}
            aria-label={REPLAY_WORD_LABEL}
            onClick={onReplay}
            disabled={!speechEnabled}
            sx={{ borderRadius: 3, minHeight: 48 }}
          >
            {REPLAY_WORD_LABEL}
          </Button>
          {!speechEnabled && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Turn on speech in Parent Settings to hear the word.
            </Typography>
          )}
        </Box>
      )}

      <Grid container spacing={2}>
        {question.options.map((option, index) => {
          let bgcolor = 'background.paper';
          let borderColor = 'divider';
          if (showResult) {
            if (option === question.correctAnswer) { bgcolor = '#00B89422'; borderColor = '#00B894'; }
            else if (option === answered) { bgcolor = '#E1705522'; borderColor = '#E17055'; }
          }
          return (
            <Grid size={{ xs: 12, sm: 6 }} key={`${option}-${index}`}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onAnswer(option)}
                disabled={showResult}
                sx={{
                  p: 2, borderRadius: 3, fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 700,
                  minHeight: 56, whiteSpace: 'normal', lineHeight: 1.2, overflowWrap: 'anywhere',
                  bgcolor, borderColor, border: '2px solid',
                  color: 'text.primary', textTransform: 'none',
                  '&:hover': { bgcolor: `${borderColor}22` },
                  '&.Mui-disabled': { bgcolor, borderColor, color: 'text.primary' },
                }}
              >
                {option}
                {showResult && option === question.correctAnswer && ' ✓'}
                {showResult && option === answered && option !== question.correctAnswer && ' ✗'}
              </Button>
            </Grid>
          );
        })}
      </Grid>

      {showResult && (
        <Box sx={{ mt: 2 }} aria-live="polite">
          <Typography variant="h5" sx={{ color: answered === question.correctAnswer ? 'success.main' : 'error.main', fontWeight: 700 }}>
            {answered === question.correctAnswer ? 'Correct! 🎉' : `Good try! The answer is ${question.correctAnswer}.`}
          </Typography>
          {onNext && (
            <Button variant="contained" endIcon={<NavigateNext />} onClick={onNext} sx={{ mt: 2, borderRadius: 3 }}>
              {nextLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
