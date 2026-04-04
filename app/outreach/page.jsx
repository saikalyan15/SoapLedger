import { getReorderCandidates, getScheduledFollowUps } from '@/lib/queries/customers';
import OutreachView from './OutreachView';

export const dynamic = 'force-dynamic';

export default async function OutreachPage() {
  const [dueNow, scheduled] = await Promise.all([
    getReorderCandidates(),
    getScheduledFollowUps(),
  ]);
  return <OutreachView dueNow={dueNow} scheduled={scheduled} />;
}
