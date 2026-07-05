import DeckWall from './DeckWall';
import ReviewPage from './DeckWall/ReviewPage';
import { isInAigram } from '@shared/runtime';

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const reviewMode = params.get('review') === '1' || (!isInAigram && params.get('play') !== '1');
  if (reviewMode) return <ReviewPage />;
  return <DeckWall />;
}
