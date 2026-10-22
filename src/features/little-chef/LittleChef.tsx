import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, ButtonBase, Grid, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { CheckCircleRounded, UndoRounded, VolumeUpRounded } from '@mui/icons-material';
import Page from '../../components/ui/Page';
import Illustration from '../../components/ui/Illustration';
import RoundIconButton from '../../components/ui/RoundIconButton';
import Confetti from '../../components/ui/Confetti';
import { tactile, useWorld } from '../../components/ui/world';
import { fonts } from '../../theme/tokens';
import { useAppStore } from '../../store/useAppStore';
import { NO_LEVELS } from '../learning-games/catalog';
import { playConfirmation, playNote, playSuccess } from '../../services/audio';
import { GameHeader, GameResults } from '../learning-games/GameChrome';
import GameIntro from '../learning-games/GameIntro';
import ScreenReaderStatus from '../learning-games/ScreenReaderStatus';
import { useGameFeedback } from '../learning-games/useGameFeedback';
import type { GameDifficulty } from '../learning-games/difficulty';
import {
  actions, addIngredient, addedThisStep, amount, currentStep, doAction, ingredientById, isCooked, pantryFor, recipes, shoppingList, startCooking, stepText, undoIngredient,
  type Kitchen, type Recipe,
} from './recipes';

export default function LittleChef() {
  const theme = useTheme();
  const navigate = useNavigate();
  const green = useWorld('green');
  const sun = useWorld('sun');
  const orange = useWorld('orange');
  const { say, sound, settings } = useGameFeedback();
  const madeRecipes = useAppStore((s) => s.progress.gameLevels.chef) ?? NO_LEVELS;
  const completeGameRound = useAppStore((s) => s.completeGameRound);
  const addWordLearned = useAppStore((s) => s.addWordLearned);

  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(settings.gameDifficulty);
  const [recipe, setRecipe] = useState<Recipe>(recipes[0]);
  const [kitchen, setKitchen] = useState<Kitchen>(startCooking(recipes[0]));
  const [shake, setShake] = useState<string | null>(null);
  const [stirring, setStirring] = useState(false);
  const [status, setStatus] = useState('');
  const [celebrate, setCelebrate] = useState(0);

  const guided = difficulty === 'beginner';
  const showPicture = difficulty !== 'advanced';

  const speakStep = (next: Kitchen) => {
    const step = currentStep(next);
    if (step) say(stepText(step));
  };

  const cook = (target: Recipe) => {
    const next = startCooking(target);
    setRecipe(target);
    setKitchen(next);
    setPhase('play');
    const list = shoppingList(target).map(({ ingredient, count }) => amount(ingredient, count)).join(', ');
    setStatus(`Let's make ${target.title}! You will need ${list}.`);
    say(`Let's make ${target.title}! ${stepText(target.steps[0])}`);
  };

  const add = (id: string) => {
    const { kitchen: next, result } = addIngredient(kitchen, id);
    const item = ingredientById(id);
    const step = currentStep(kitchen);
    if (result === 'wrong-ingredient' && step?.kind === 'add') {
      setShake(id);
      window.setTimeout(() => setShake(null), 450);
      const message = `That's ${amount(item, 1).replace(/^one /, 'a ')}. Now we need ${ingredientById(step.ingredient).plural}.`;
      setStatus(message);
      say(message);
      return;
    }
    if (result === 'not-now' && step?.kind === 'action') {
      const message = `That's enough food! Now: ${actions[step.action].text}`;
      setStatus(message);
      say(message);
      return;
    }
    if (result !== 'added' && result !== 'step-done') return;
    setKitchen(next);
    addWordLearned(item.name.charAt(0).toUpperCase() + item.name.slice(1));
    sound((v) => playNote(600 + addedThisStep(next) * 80, 0.1, v * 0.22, 'triangle'));
    if (result === 'step-done') {
      sound((v) => playConfirmation(v * 0.2));
      const nextStep = currentStep(next);
      const message = nextStep ? `Great! ${stepText(nextStep)}` : 'Great!';
      setStatus(message);
      say(message);
    } else if (step?.kind === 'add') {
      const count = addedThisStep(next);
      setStatus(`${count} of ${step.count}.`);
      say(String(count));
    }
  };

  const act = () => {
    const { kitchen: next, ok } = doAction(kitchen);
    if (!ok) return;
    setStirring(true);
    window.setTimeout(() => setStirring(false), 900);
    setKitchen(next);
    if (isCooked(next)) {
      completeGameRound('chef', recipe.id);
      setCelebrate((count) => count + 1);
      sound((v) => playSuccess(v * 0.3));
      say(`Yum! You made ${recipe.title}!`);
      window.setTimeout(() => setPhase('done'), 1100);
    }
  };

  if (phase === 'intro') {
    return (
      <GameIntro
        title="Little Chef"
        subtitle="A pretend kitchen. Follow the recipe and count the food!"
        emoji="🥗"
        world="green"
        steps={[
          { emoji: '📖', text: 'Pick a recipe.' },
          { emoji: '👆', text: 'Tap the food the recipe asks for. Count as you go!' },
          { emoji: '🥄', text: 'Mix, shake, or serve to finish.' },
        ]}
        difficulty={difficulty}
        onDifficulty={setDifficulty}
        onStart={() => cook(recipes.find((item) => !madeRecipes.includes(item.id)) ?? recipes[0])}
        onHear={() => say('Pick a recipe. Then tap the food it asks for, and count as you go. This is pretend cooking, just for fun!')}
        startLabel="Cook the next recipe"
      >
        <Grid container spacing={2}>
          {recipes.map((item) => {
            const made = madeRecipes.includes(item.id);
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={item.id}>
                <ButtonBase
                  onClick={() => cook(item)}
                  aria-label={`${item.title}${made ? ', made before' : ''}`}
                  sx={[tactile(theme, made ? green : sun, { state: made ? 'done' : 'idle', depth: 5, radius: 22 }), { width: '100%', p: 2, gap: 1.5, justifyContent: 'flex-start' }]}
                >
                  <Illustration emoji={item.emoji} size="48px" />
                  <Box sx={{ textAlign: 'left', flex: 1 }}>
                    <Typography sx={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '1.15rem' }}>{item.title}</Typography>
                    <Box aria-hidden sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {shoppingList(item).map(({ ingredient }) => <Illustration key={ingredient.id} emoji={ingredient.emoji} size="22px" />)}
                    </Box>
                  </Box>
                  {made && <CheckCircleRounded sx={{ color: green.main }} aria-hidden />}
                </ButtonBase>
              </Grid>
            );
          })}
        </Grid>
      </GameIntro>
    );
  }

  if (phase === 'done') {
    return (
      <GameResults
        stars={3}
        message={`You made ${recipe.title}! ${madeRecipes.length} of ${recipes.length} recipes made.`}
        celebrate={celebrate}
        onPlayAgain={() => setPhase('intro')}
        onChooseGame={() => navigate('/games')}
      />
    );
  }

  const step = currentStep(kitchen);
  const needed = step?.kind === 'add' ? ingredientById(step.ingredient) : null;
  const pantry = pantryFor(recipe, guided);

  return (
    <Page maxWidth={1040}>
      <GameHeader
        title={recipe.title}
        emoji={recipe.emoji}
        world="green"
        backLabel="Recipes"
        onBack={() => setPhase('intro')}
        progress={{ value: kitchen.step, total: recipe.steps.length, label: `Step ${Math.min(kitchen.step + 1, recipe.steps.length)} of ${recipe.steps.length}` }}
      />

      {step && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2, p: 2, borderRadius: '24px', bgcolor: sun.tint, flexWrap: 'wrap' }}>
          {showPicture && <Illustration emoji={needed ? needed.emoji : actions[step.kind === 'action' ? step.action : 'mix'].emoji} size="48px" />}
          <Typography variant="h3" component="h2" sx={{ fontSize: { xs: '1.3rem', md: '1.6rem' } }}>{stepText(step)}</Typography>
          {step.kind === 'add' && (
            <Typography sx={{ fontWeight: 900, px: 1.5, py: 0.5, borderRadius: '999px', bgcolor: 'background.paper' }}>
              {addedThisStep(kitchen)} of {step.count}
            </Typography>
          )}
          <RoundIconButton label="Hear the step" world="sun" size={48} onClick={() => speakStep(kitchen)}>
            <VolumeUpRounded />
          </RoundIconButton>
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 3, alignItems: 'start' }}>
        <Box component="ol" aria-label="Recipe steps" sx={{ m: 0, p: 2, listStyle: 'none', borderRadius: '24px', bgcolor: 'background.paper', border: `3px solid ${green.tint}`, display: 'grid', gap: 1 }}>
          {recipe.steps.map((item, index) => {
            const doneStep = index < kitchen.step;
            const now = index === kitchen.step;
            return (
              <Box component="li" key={index} aria-current={now ? 'step' : undefined} sx={{ display: 'flex', gap: 1, alignItems: 'center', fontWeight: now ? 900 : 700, opacity: doneStep ? 0.6 : 1, color: now ? green.text : 'text.primary' }}>
                {doneStep ? <CheckCircleRounded sx={{ color: green.main }} aria-label="done" /> : <Box aria-hidden sx={{ width: 24, textAlign: 'center' }}>{index + 1}.</Box>}
                <Typography component="span" sx={{ fontWeight: 'inherit', textDecoration: doneStep ? 'line-through' : 'none' }}>{stepText(item)}</Typography>
              </Box>
            );
          })}
        </Box>

        <Box>
          <Box
            role="img"
            aria-label={`The ${recipe.container}: ${kitchen.bowl.length === 0 ? 'empty' : kitchen.bowl.map((item) => ingredientById(item.ingredient).name).join(', ')}`}
            sx={{
              minHeight: 150,
              p: 2,
              mb: 2,
              borderRadius: recipe.container === 'cup' ? '24px 24px 60px 60px' : '50% / 30%',
              bgcolor: alpha(orange.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
              border: `4px solid ${alpha(orange.main, 0.45)}`,
              display: 'flex',
              flexWrap: 'wrap',
              alignContent: 'center',
              justifyContent: 'center',
              gap: 0.5,
              animation: stirring ? 'kl-wiggle 900ms ease-in-out' : 'none',
            }}
          >
            {kitchen.bowl.length === 0 && <Typography color="text.secondary" sx={{ fontWeight: 800 }}>Your {recipe.container} is empty</Typography>}
            {kitchen.bowl.map((item, index) => (
              <Box key={index} aria-hidden sx={{ fontSize: '2.4rem', lineHeight: 1, animation: 'kl-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
                <Illustration emoji={ingredientById(item.ingredient).emoji} />
              </Box>
            ))}
          </Box>

          {step?.kind === 'action' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button variant="contained" size="large" onClick={act} startIcon={<Illustration emoji={actions[step.action].emoji} />} sx={{ fontSize: '1.4rem', px: 5, py: 1.5, bgcolor: green.main, '&:hover': { bgcolor: green.dark } }}>
                {actions[step.action].button}
              </Button>
            </Box>
          ) : null}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}>
            <Typography variant="h4" component="h2" sx={{ fontSize: '1.15rem' }}>Kitchen counter</Typography>
            <Button variant="outlined" startIcon={<UndoRounded />} onClick={() => setKitchen(undoIngredient(kitchen))} disabled={addedThisStep(kitchen) === 0}>
              Take one out
            </Button>
          </Box>
          <Box role="group" aria-label="Food to add" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5 }}>
            {pantry.map((item) => {
              const glow = guided && needed?.id === item.id;
              return (
                <ButtonBase
                  key={item.id}
                  aria-label={`Add ${item.name}`}
                  disabled={!step}
                  onClick={() => add(item.id)}
                  sx={[
                    tactile(theme, glow ? green : sun, { state: glow ? 'selected' : 'idle', depth: 5, radius: 20 }),
                    { flexDirection: 'column', gap: 0.5, py: 1.5, minHeight: 104, animation: shake === item.id ? 'kl-shake 420ms ease-in-out' : 'none', outline: glow ? `4px solid ${alpha(green.main, 0.35)}` : 'none', outlineOffset: 2 },
                  ]}
                >
                  <Illustration emoji={item.emoji} size="44px" />
                  <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.15, px: 0.5, textAlign: 'center' }}>{item.name}</Typography>
                  {glow && <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 900 }}>Tap me!</Typography>}
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      </Box>
      <ScreenReaderStatus message={status} />
      <Confetti fire={celebrate} />
    </Page>
  );
}
