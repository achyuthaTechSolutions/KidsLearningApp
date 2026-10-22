import { Box, Button, ButtonBase, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { NavigateNext, VolumeUpRounded, CheckRounded, CloseRounded } from '@mui/icons-material';
import { REPLAY_WORD_LABEL, type QuizQuestion } from './questions';
import IllustrationBubble from '../../components/ui/IllustrationBubble';
import Mascot from '../../components/ui/Mascot';
import { resolveWorld, tactile, useWorld } from '../../components/ui/world';
import { fonts, type WorldKey } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';

interface Props {
  question: QuizQuestion;
  answered: string | null;
  onAnswer: (answer: string) => void;
  onReplay: () => void;
  onNext?: () => void;
  nextLabel?: string;
  speechEnabled: boolean;
}

/** Answer colors avoid green and orange, which mean "right" and "try again". */
const optionWorlds: WorldKey[] = ['blue', 'pink', 'violet', 'teal'];

function splitCountPrompt(question: QuizQuestion): { text: string; objects: string[] } {
  if (question.type !== 'count' || !question.emoji) return { text: question.prompt, objects: [] };
  const mark = question.prompt.indexOf('?');
  if (mark < 0) return { text: question.prompt, objects: [] };
  const count = Number(question.correctAnswer);
  return { text: question.prompt.slice(0, mark + 1), objects: Array.from({ length: count }, () => question.emoji ?? '') };
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
  const theme = useTheme();
  const green = useWorld('green');
  const orange = useWorld('orange');
  const teal = useWorld('teal');
  const showResult = answered !== null;
  const isListen = question.type === 'listen';
  const correct = answered === question.correctAnswer;
  const { text, objects } = splitCountPrompt(question);
  const shortOptions = question.options.every((option) => option.length <= 2);

  return (
    <Box sx={{ textAlign: 'center' }}>
      {question.emoji && question.type !== 'count' && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <IllustrationBubble emoji={question.emoji} world="teal" size="md" popKey={question.prompt} />
        </Box>
      )}
      {isListen && (
        <Box aria-hidden sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <IllustrationBubble emoji="👂" world="teal" size="md" />
        </Box>
      )}

      <Typography
        data-testid="quiz-prompt"
        variant="h3"
        component="h2"
        sx={{ mb: objects.length ? 1.5 : 2.5, overflowWrap: 'anywhere', fontSize: { xs: '1.4rem', md: '1.75rem' } }}
      >
        {text}
      </Typography>

      {objects.length > 0 && (
        <Box
          role="img"
          aria-label={`${objects.length} ${objects.length === 1 ? 'picture' : 'pictures'} to count`}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: { xs: 0.75, md: 1 },
            p: 2,
            mb: 2.5,
            borderRadius: '24px',
            bgcolor: teal.tint,
            border: `3px dashed ${alpha(teal.main, 0.45)}`,
          }}
        >
          {objects.map((emoji, index) => (
            <Box key={index} aria-hidden sx={{ fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1.1, animation: `kl-pop-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 70}ms both` }}>
              <Illustration emoji={emoji} />
            </Box>
          ))}
        </Box>
      )}

      {isListen && !showResult && (
        <Box sx={{ mb: 2.5 }}>
          <Button
            variant="contained"
            color="info"
            startIcon={<VolumeUpRounded />}
            aria-label={REPLAY_WORD_LABEL}
            onClick={onReplay}
            disabled={!speechEnabled}
            sx={{ fontSize: '1.1rem', px: 3, py: 1.25 }}
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: shortOptions ? 'repeat(2, 1fr)' : '1fr', sm: 'repeat(2, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
        {question.options.map((option, index) => {
          const isAnswer = option === question.correctAnswer;
          const isChosen = option === answered;
          const w = resolveWorld(
            showResult ? (isAnswer ? 'green' : isChosen ? 'orange' : 'slate') : optionWorlds[index % optionWorlds.length],
            theme.palette.mode,
          );
          const state = showResult ? (isAnswer ? 'selected' : isChosen ? 'done' : 'idle') : 'selected';
          return (
            <ButtonBase
              key={`${option}-${index}`}
              onClick={() => onAnswer(option)}
              disabled={showResult}
              sx={[
                tactile(theme, w, { state, depth: 6, radius: 24 }),
                {
                  minHeight: shortOptions ? { xs: 88, md: 104 } : { xs: 64, md: 76 },
                  px: 2,
                  gap: 1,
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: shortOptions ? { xs: '2.2rem', md: '2.6rem' } : { xs: '1.25rem', md: '1.4rem' },
                  lineHeight: 1.15,
                  overflowWrap: 'anywhere',
                  animation: showResult
                    ? isAnswer
                      ? 'kl-pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both'
                      : isChosen
                        ? 'kl-shake 420ms ease-in-out'
                        : 'none'
                    : `kl-rise-in 320ms ease-out ${index * 60}ms both`,
                  opacity: showResult && !isAnswer && !isChosen ? 0.5 : 1,
                  '&.Mui-disabled': { color: state === 'selected' ? w.onMain : w.text },
                },
              ]}
            >
              {option}
              {showResult && isAnswer && <CheckRounded aria-hidden sx={{ fontSize: '1.6rem' }} />}
              {showResult && isChosen && !isAnswer && <CloseRounded aria-hidden sx={{ fontSize: '1.4rem' }} />}
            </ButtonBase>
          );
        })}
      </Box>

      {showResult && (
        <Box
          aria-live="polite"
          sx={{
            mt: 3,
            p: { xs: 1.5, md: 2 },
            borderRadius: '24px',
            bgcolor: correct ? green.tint : orange.tint,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
            animation: 'kl-rise-in 300ms ease-out both',
          }}
        >
          <Mascot size={64} mood={correct ? 'cheer' : 'think'} float={false} />
          <Typography variant="h4" component="p" sx={{ color: correct ? green.text : orange.text, flex: { sm: 1 }, textAlign: { xs: 'center', sm: 'left' } }}>
            {correct ? <>Correct! <Illustration emoji="🎉" sx={{ ml: 0.5 }} /></> : `Good try! The answer is ${question.correctAnswer}.`}
          </Typography>
          {onNext && (
            <Button variant="contained" color={correct ? 'success' : 'primary'} endIcon={<NavigateNext />} onClick={onNext} sx={{ fontSize: '1.1rem', px: 3 }}>
              {nextLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
