import { getRawMaterials } from '@/lib/queries/rawMaterials';
import RawMaterialsView from './RawMaterialsView';

export const dynamic = 'force-dynamic';

export default async function RawMaterialsPage() {
  const materials = await getRawMaterials();
  
  return <RawMaterialsView materials={materials} />;
}
