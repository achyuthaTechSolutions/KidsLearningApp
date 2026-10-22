import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Privacy
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This app keeps learning on this device.
        </Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 1 }}>What is saved here</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Letters, numbers, animals, and words a child has explored, game counts, the answer streak, earned achievements, today’s daily challenge, and parent settings (sound, speech, voice, theme, and reduced motion) are saved on this device.
          </Typography>
          <Typography variant="body1">
            The Android app stores the same information in the app’s private storage. It is not sent to a server, an account, or an analytics service. This app does not include ads.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 1 }}>What this app does not use</Typography>
          <Typography variant="body1">
            There is no sign-in, cloud sync, microphone, camera, location, social sharing, or purchase flow. Spoken words use the device’s own speech, and sounds are created on the device. Lessons work without an internet connection.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 1 }}>Reset and uninstall</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Reset All Progress in Parent Settings asks a parent to answer a short question first. Reset clears explored content, scores, the answer streak, achievements, and today’s daily challenge. It does not change sound or speech settings.
          </Typography>
          <Typography variant="body1">
            Uninstalling the app, or clearing the app’s storage, removes this saved learning. Android backup of this app’s data is turned off, so the progress is not copied to a cloud backup.
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800, mb: 1 }}>Before a store listing</Typography>
          <Typography variant="body1">
            A parent or owner still needs to complete and publish a privacy policy, including a contact method, before submitting the app to Google Play. The in-app page describes how this version works. It is not a substitute for that published policy, and it does not promise that a store will accept the app.
          </Typography>
        </CardContent>
      </Card>

      <Button component={RouterLink} to="/settings" variant="outlined" sx={{ minHeight: 48 }}>
        Back to Parent Settings
      </Button>
    </Box>
  );
}
