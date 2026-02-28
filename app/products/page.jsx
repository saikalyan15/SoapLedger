import { getProducts } from '@/lib/queries/products';
import ProductView from './ProductView';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getProducts();
  
  return <ProductView products={products} />;
}
