import { getProducts } from '@/lib/queries/products';
import { getAllEssentialOils } from '@/lib/queries/essential_oils';
import ProductView from './ProductView';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, allOils] = await Promise.all([
    getProducts(),
    getAllEssentialOils(),
  ]);

  return <ProductView products={products} allOils={allOils} />;
}
