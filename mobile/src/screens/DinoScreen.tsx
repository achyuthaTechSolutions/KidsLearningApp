import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  createGame,
  dinoBox,
  dinoColorById,
  dinoColors,
  GROUND_Y,
  startGame,
  step,
  themeForLevel,
  VIEW_HEIGHT,
  type GameInput,
  type GameState,
} from '@kids/learning-core';
import { useAppStore } from '../store/useAppStore';
import { useLearning } from '../hooks/useLearning';
import { playConfirmation, playError, playInstrument, playSuccess } from '../services/audio';
import { speak } from '../services/speech';
import { BigButton, Body, Screen, Title } from '../ui/components';
import { useMotionEnabled, usePalette } from '../ui/theme';

export default function DinoScreen() {
  const palette = usePalette();
  const motion = useMotionEnabled();
  const { settings } = useLearning();
  const dino = useAppStore((state) => state.dino);
  const setDino = useAppStore((state) => state.setDino);
  const color = dinoColorById(dino.color);
  const gameRef = useRef<GameState>(createGame(900));
  const inputRef = useRef<GameInput>({ jumpHeld: false, jumpPressed: false, duckHeld: false });
  const [tick, setTick] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    let frame = 0;
    let last = Date.now();
    const loop = () => {
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const game = gameRef.current;
      if (game.status === 'running') {
        const events = step(game, dt, inputRef.current);
        inputRef.current.jumpPressed = false;
        const current = useAppStore.getState();
        for (const event of events) {
          if (event.type === 'jump' && current.settings.soundEnabled) playInstrument('jump', 620, current.settings.volume * 0.4);
          if (event.type === 'hit') {
            if (current.settings.soundEnabled) playError(current.settings.volume);
            setBanner(`${event.livesLeft} ${event.livesLeft === 1 ? 'heart' : 'hearts'} left`);
          }
          if (event.type === 'letter') {
            if (current.settings.soundEnabled) playConfirmation(current.settings.volume);
            if (current.settings.speechEnabled) speak(event.letter, { rate: current.settings.speechRate, voice: current.settings.selectedVoice, volume: current.settings.volume });
            setBanner(`You caught ${event.letter}`);
          }
          if (event.type === 'heart') setBanner(`Extra heart! ${event.lives} hearts.`);
          if (event.type === 'levelUp') {
            const world = themeForLevel(event.level);
            if (current.settings.soundEnabled) playSuccess(current.settings.volume);
            setBanner(`Level ${event.level} · ${world.name}`);
            if (current.settings.speechEnabled) speak(`Level ${event.level}! ${world.name}!`, { rate: current.settings.speechRate, voice: current.settings.selectedVoice, volume: current.settings.volume });
          }
          if (event.type === 'gameOver') {
            const best = current.dino;
            const next = {
              ...best,
              bestScore: Math.max(best.bestScore, game.score),
              bestLevel: Math.max(best.bestLevel, game.level),
            };
            setDino(next);
            const freshBest = game.score > best.bestScore;
            setSummary(freshBest ? `New best! Score ${game.score}, level ${game.level}.` : `Score ${game.score}, level ${game.level}.`);
            if (current.settings.speechEnabled) speak(freshBest ? `New best score! You reached level ${game.level}!` : `Great run! You reached level ${game.level}!`, { rate: current.settings.speechRate, voice: current.settings.selectedVoice, volume: current.settings.volume });
          }
        }
        setTick((value) => value + 1);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [setDino]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && gameRef.current.status === 'running') {
        gameRef.current.status = 'paused';
        setTick((value) => value + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  const game = gameRef.current;
  const theme = themeForLevel(game.level);
  const scale = width / game.viewWidth;
  const box = dinoBox(game.dino);
  void tick;

  const begin = () => {
    if (game.status === 'over' || game.status === 'ready') {
      gameRef.current = createGame(900);
      startGame(gameRef.current);
      setSummary(null);
    } else if (game.status === 'paused') {
      startGame(game);
    }
    setTick((value) => value + 1);
  };

  return (
    <Screen scroll={false}>
      <View style={styles.page}>
        <Title>Dino Dash</Title>
        <Body>Best {dino.bestScore} · level {dino.bestLevel}. Jump and duck with the big buttons.</Body>
        <View
          accessibilityLabel={`Dino Dash. ${game.status}. Score ${game.score}. Level ${game.level}.`}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={[styles.stage, { height: VIEW_HEIGHT * scale, backgroundColor: theme.skyTop }]}
        >
          <View style={[styles.ground, { top: GROUND_Y * scale, height: (VIEW_HEIGHT - GROUND_Y) * scale, backgroundColor: theme.ground }]} />
          {game.obstacles.map((obstacle) => (
            <View
              key={obstacle.id}
              style={{
                position: 'absolute',
                left: obstacle.x * scale,
                top: (GROUND_Y - obstacle.lift - obstacle.h) * scale,
                width: obstacle.w * scale,
                height: obstacle.h * scale,
                borderRadius: 8,
                backgroundColor: obstacle.kind.startsWith('bird') ? theme.bird : obstacle.kind === 'rock' ? theme.rock : theme.cactus,
              }}
            />
          ))}
          {game.pickups.map((pickup) => (
            <Text
              key={pickup.id}
              style={{ position: 'absolute', left: (pickup.x - pickup.r) * scale, top: (GROUND_Y - pickup.lift - pickup.r) * scale, fontSize: 22 * scale }}
            >
              {pickup.kind === 'heart' ? '❤️' : pickup.letter}
            </Text>
          ))}
          <View
            accessibilityLabel={`${color.name} dinosaur`}
            style={{
              position: 'absolute',
              left: box.x * scale,
              top: (GROUND_Y - box.bottom - box.h) * scale,
              width: box.w * scale,
              height: box.h * scale,
              borderRadius: 16,
              backgroundColor: color.body,
              opacity: game.time < game.invincibleUntil && motion ? 0.55 : 1,
            }}
          />
          {game.status !== 'running' ? (
            <Pressable accessibilityRole="button" accessibilityLabel={game.status === 'paused' ? 'Keep going' : 'Start'} onPress={begin} style={styles.overlay}>
              <Text style={styles.overlayText}>{game.status === 'paused' ? 'Paused' : game.status === 'over' ? 'Run again' : 'Tap to start'}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={{ color: palette.text, fontFamily: 'Nunito_800ExtraBold' }}>
          Score {game.score} · Level {game.level} · {'❤️'.repeat(game.lives)} {banner ?? theme.name}
        </Text>
        {summary ? <Body>{summary}</Body> : null}
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump"
            onPressIn={() => {
              inputRef.current.jumpHeld = true;
              inputRef.current.jumpPressed = true;
              if (game.status !== 'running') begin();
            }}
            onPressOut={() => { inputRef.current.jumpHeld = false; }}
            style={[styles.hold, { backgroundColor: '#0F9D68' }]}
          >
            <Text style={styles.holdText}>Jump</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Duck"
            onPressIn={() => { inputRef.current.duckHeld = true; }}
            onPressOut={() => { inputRef.current.duckHeld = false; }}
            style={[styles.hold, { backgroundColor: '#1F86EB' }]}
          >
            <Text style={styles.holdText}>Duck</Text>
          </Pressable>
        </View>
        <BigButton
          label={game.status === 'paused' ? 'Keep going' : 'Pause'}
          world="violet"
          onPress={() => {
            if (game.status === 'running') game.status = 'paused';
            else if (game.status === 'paused') startGame(game);
            setTick((value) => value + 1);
          }}
        />
        <Body>Pick a dinosaur colour. It stays on this device.</Body>
        <View style={styles.colors}>
          {dinoColors.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} dinosaur`}
              accessibilityState={{ selected: dino.color === item.id }}
              onPress={() => setDino({ ...dino, color: item.id })}
              style={[styles.swatch, { backgroundColor: item.body, borderColor: dino.color === item.id ? '#FFFFFF' : item.dark }]}
            />
          ))}
        </View>
        {!settings.speechEnabled ? <Body>Speech is off. Letters you catch are still shown on the screen.</Body> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12, gap: 8 },
  stage: { borderRadius: 18, overflow: 'hidden' },
  ground: { position: 'absolute', left: 0, right: 0 },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.18)' },
  overlayText: { color: '#FFFFFF', fontFamily: 'Fredoka_700Bold', fontSize: 28 },
  controls: { flexDirection: 'row', gap: 8 },
  colors: { flexDirection: 'row', gap: 8 },
  swatch: { width: 48, height: 48, borderRadius: 16, borderWidth: 3 },
  hold: { flex: 1, minHeight: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  holdText: { color: '#FFFFFF', fontFamily: 'Fredoka_700Bold', fontSize: 22 },
});
