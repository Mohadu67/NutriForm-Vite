import WorkoutCard from './WorkoutCard';
import MealCard from './MealCard';
import RecipeCard from './RecipeCard';
import ChallengeCard from './ChallengeCard';

export default function FeedCard({ item }) {
  switch (item.type) {
    case 'workout': return <WorkoutCard item={item} />;
    case 'meal':    return <MealCard item={item} />;
    case 'recipe':  return <RecipeCard item={item} />;
    case 'challenge': return <ChallengeCard item={item} />;
    default: return null;
  }
}
