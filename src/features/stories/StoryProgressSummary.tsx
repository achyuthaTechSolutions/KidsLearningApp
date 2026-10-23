import { useMemo } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { loadStoryProgress } from '../../services/storage';
import { isCompleted, summarizeObjectives, type ObjectiveLevel } from './engine/progress';
import { allStories } from './content/library';
import { objectiveLabels } from './content/uiText';

const levelText: Record<ObjectiveLevel, string> = {
  practising: 'Practising',
  succeeding: 'Succeeding',
  mastered: 'Mastered',
};

/**
 * Story Time progress for grown-ups, shown inside the existing Learning summary.
 * "Mastered" needs three clean answers across two activities. Speed is never measured.
 */
export default function StoryProgressSummary() {
  const data = useMemo(() => loadStoryProgress(), []);
  const started = allStories.filter((story) => data.stories[story.id]).length;
  const finished = allStories.filter((story) => isCompleted(data, story.id)).length;
  const objectives = summarizeObjectives(data.events).sort((a, b) => a.objective.localeCompare(b.objective));
  const needPractice = objectives.filter((item) => item.needsPractice);

  return (
    <Box component="section" aria-label="Story Time progress" sx={{ mt: 3 }}>
      <Typography variant="h4" component="h3" sx={{ fontSize: '1.05rem', mb: 0.5 }}>Story Time</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Stories started: {started} of {allStories.length}. Finished: {finished}. Activities answered: {data.events.length}.
      </Typography>
      {objectives.length === 0 ? (
        <Typography variant="body2" color="text.secondary">Skills will appear here after your child answers a story activity.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 0.75 }}>
          {objectives.map((item) => (
            <Box key={item.objective} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, minWidth: 140 }}>{objectiveLabels[item.objective].en}</Typography>
              <Chip size="small" label={levelText[item.level]} color={item.level === 'mastered' ? 'success' : item.level === 'succeeding' ? 'primary' : 'default'} />
              <Typography variant="body2" color="text.secondary">
                {item.clean} first-try {item.clean === 1 ? 'answer' : 'answers'} across {item.activities} {item.activities === 1 ? 'activity' : 'activities'}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      {needPractice.length > 0 && (
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          Might like more practice: {needPractice.map((item) => objectiveLabels[item.objective].en).join(', ')}.
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Practising means tried. Succeeding means at least one first-try answer without a hint. Mastered means three first-try answers across at least two different activities.
      </Typography>
    </Box>
  );
}
