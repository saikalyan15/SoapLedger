import { getReorderCandidates, getScheduledFollowUps, getReferralCandidates } from '@/lib/queries/customers';
import OutreachView from './OutreachView';

export const dynamic = 'force-dynamic';

export default async function OutreachPage() {
  const [dueNow, scheduled, referralCandidates] = await Promise.all([
    getReorderCandidates(),
    getScheduledFollowUps(),
    getReferralCandidates(),
  ]);
  return <OutreachView dueNow={dueNow} scheduled={scheduled} referralCandidates={referralCandidates} />;
}
