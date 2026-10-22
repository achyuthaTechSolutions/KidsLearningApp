import { useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography,
} from '@mui/material';
import { pushOverlay } from '../../platform/overlays';
import { createParentChallenge, isParentAnswer, type ParentChallenge } from './parentChallenge';

interface Props {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onGranted: () => void;
}

function ParentGateForm({ description, onClose, onGranted }: Omit<Props, 'open' | 'title'>) {
  const [challenge] = useState<ParentChallenge>(() => createParentChallenge());
  const [value, setValue] = useState('');
  const [rejected, setRejected] = useState(false);

  useEffect(() => pushOverlay(onClose), [onClose]);

  const submit = () => {
    if (!isParentAnswer(challenge, value)) {
      setRejected(true);
      setValue('');
      return;
    }
    onGranted();
  };

  return (
    <>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>{description}</Typography>
        <Typography variant="h6" component="p" sx={{ fontWeight: 800, mb: 1 }}>{challenge.prompt}</Typography>
        <TextField
          autoFocus
          fullWidth
          label="Answer"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setRejected(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
          slotProps={{ htmlInput: { inputMode: 'numeric', 'aria-label': 'Parent check answer' } }}
        />
        {rejected && (
          <Typography role="alert" color="error" sx={{ mt: 1 }}>
            That answer does not match. Please try the question again.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>Continue</Button>
      </DialogActions>
    </>
  );
}

export default function ParentGate({ open, title, description, onClose, onGranted }: Props) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="parent-gate-title" fullWidth maxWidth="xs">
      <DialogTitle id="parent-gate-title">{title}</DialogTitle>
      {open ? (
        <ParentGateForm description={description} onClose={onClose} onGranted={onGranted} />
      ) : (
        <DialogContent />
      )}
    </Dialog>
  );
}
