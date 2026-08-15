import { getInterests } from '@/lib/queries/interests';
import InterestsView from './InterestsView';

export const dynamic = 'force-dynamic';

export default async function InterestsPage() {
  const interests = await getInterests();
  return <InterestsView interests={interests} />;
}
