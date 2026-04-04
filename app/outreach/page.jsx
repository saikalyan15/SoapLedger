import { getReorderCandidates } from '@/lib/queries/customers';
import OutreachView from './OutreachView';

export const dynamic = 'force-dynamic';

export default async function OutreachPage() {
  const candidates = await getReorderCandidates();
  return <OutreachView candidates={candidates} />;
}
