import WorkoutCard from './WorkoutCard';
import MealCard from './MealCard';
import RecipeCard from './RecipeCard';
import ChallengeCard from './ChallengeCard';
import SharedSessionCard from './SharedSessionCard';

export default function FeedCard({ item }) {
  switch (item.type) {
    case 'workout': return <WorkoutCard item={item} />;
    case 'meal':    return <MealCard item={item} />;
    case 'recipe':  return <RecipeCard item={item} />;
    case 'challenge': return <ChallengeCard item={item} />;
    case 'shared_session': return <SharedSessionCard item={item} />;
    default: return null;
  }
}
