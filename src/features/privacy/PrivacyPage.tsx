import type { ReactNode } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBackRounded } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import Page from '../../components/ui/Page';
import PageHero from '../../components/ui/PageHero';
import { useWorld } from '../../components/ui/world';
import type { WorldKey } from '../../theme/tokens';
import Illustration from '../../components/ui/Illustration';

function Block({ world, emoji, title, children }: { world: WorldKey; emoji: string; title: string; children: ReactNode }) {
  const w = useWorld(world);
  return (
    <Box component="section" sx={{ display: 'flex', gap: 2, mb: 2, p: { xs: 2.25, md: 3 }, borderRadius: '28px', bgcolor: 'background.paper', border: '2px solid', borderColor: 'divider' }}>
      <Box aria-hidden sx={{ width: 52, height: 52, flexShrink: 0, borderRadius: '16px', display: 'grid', placeItems: 'center', bgcolor: w.tint, fontSize: '1.7rem' }}><Illustration emoji={emoji} /></Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 1 }}>{title}</Typography>
        {children}
      </Box>
    </Box>
  );
}

export default function PrivacyPage() {
  return (
    <Page maxWidth={820}>
      <PageHero world="slate" title="Privacy" subtitle="This app keeps learning on this device." emoji="🛡️" />

      <Block world="green" emoji="💾" title="What is saved here">
        <Typography variant="body1" sx={{ mb: 1 }}>
          Letters, numbers, animals, and words a child has explored, game counts, Dino Dash best scores and dino colour, the answer streak, earned achievements, today’s daily challenge, Story Time positions and which story activities were answered (with how many tries and hints), and parent settings (sound, speech, voice, theme, reduced motion, game level, and story language) are saved on this device.
        </Typography>
        <Typography variant="body1">
          The Android app stores the same information in the app’s private storage. It is not sent to a server, an account, or an analytics service. This app does not include ads.
        </Typography>
      </Block>

      <Block world="pink" emoji="📸" title="Photos for My Photo Puzzle">
        <Typography variant="body1" sx={{ mb: 1 }}>
          A grown-up can add up to 8 photos from this device to turn into puzzles, after answering a short parent question. The app opens the device’s own picture picker; it does not use the camera and does not look through other photos.
        </Typography>
        <Typography variant="body1">
          Each photo is cropped to a square, made smaller, and saved without its original details, such as where it was taken. Photos and their names stay in this app’s storage on this device. They are never uploaded or shared. A grown-up can delete them in the game, and Reset All Progress deletes them too.
        </Typography>
      </Block>

      <Block world="blue" emoji="🚫" title="What this app does not use">
        <Typography variant="body1">
          There is no sign-in, cloud sync, microphone, camera, location, photo upload, social sharing, or purchase flow. Spoken words use the device’s own speech, and sounds are created on the device. Lessons work without an internet connection.
        </Typography>
      </Block>

      <Block world="orange" emoji="🧹" title="Reset and uninstall">
        <Typography variant="body1" sx={{ mb: 1 }}>
          Reset All Progress in Parent Settings asks a parent to answer a short question first. Reset clears explored content, scores (including Dino Dash), the answer streak, achievements, today’s daily challenge, and puzzle photos. It does not change sound or speech settings.
        </Typography>
        <Typography variant="body1">
          Uninstalling the app, or clearing the app’s storage, removes this saved learning. Android backup of this app’s data is turned off, so the progress is not copied to a cloud backup.
        </Typography>
      </Block>

      <Block world="slate" emoji="📋" title="Before a store listing">
        <Typography variant="body1">
          A parent or owner still needs to complete and publish a privacy policy, including a contact method, before submitting the app to Google Play. The in-app page describes how this version works. It is not a substitute for that published policy, and it does not promise that a store will accept the app.
        </Typography>
      </Block>

      <Button component={RouterLink} to="/settings" variant="outlined" startIcon={<ArrowBackRounded />} sx={{ mt: 1 }}>
        Back to Parent Settings
      </Button>
    </Page>
  );
}
