import type { Attempt } from '../engine/activities';
import type { Activity, Lang } from '../engine/types';
import { ArithmeticView, CountView, PatternView, QuestionView } from './ChoiceActivities';
import { BarGraphView, EqualGroupsView, NumberLineView, SequenceView } from './MoreActivities';
import PebblePot from './PebblePot';

interface Props {
  activity: Activity;
  lang: Lang;
  say: (text: string) => void;
  onSolved: (attempt: Attempt) => void;
}

/** Picks the screen for an activity. A new activity kind fails to compile until it has one. */
export default function ActivityView({ activity, ...rest }: Props) {
  switch (activity.kind) {
    case 'pebble-pot': return <PebblePot activity={activity} {...rest} />;
    case 'question': return <QuestionView activity={activity} {...rest} />;
    case 'count': return <CountView activity={activity} {...rest} />;
    case 'arithmetic': return <ArithmeticView activity={activity} {...rest} />;
    case 'pattern': return <PatternView activity={activity} {...rest} />;
    case 'number-line': return <NumberLineView activity={activity} {...rest} />;
    case 'equal-groups': return <EqualGroupsView activity={activity} {...rest} />;
    case 'sequence': return <SequenceView activity={activity} {...rest} />;
    case 'bar-graph': return <BarGraphView activity={activity} {...rest} />;
    default: {
      const unknown: never = activity;
      return unknown;
    }
  }
}
