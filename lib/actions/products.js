'use server';

import { revalidatePath } from 'next/cache';
import { addProduct, updateProduct, toggleArchive, deleteProduct, updateProductSequence, updateFeaturedProducts } from '../queries/products';

export async function updateProductSequenceAction(updates) {
  await updateProductSequence(updates);
  revalidatePath('/products');
}

export async function updateFeaturedProductsAction(updates) {
  await updateFeaturedProducts(updates);
  revalidatePath('/products');
}

function buildSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function createProductAction(formData) {
  const name = formData.get('name');
  const slugInput = formData.get('slug');
  const data = {
    name,
    base_type: formData.get('base_type'),
    weight_grams: parseInt(formData.get('weight_grams')) || 0,
    unit_price: parseFloat(formData.get('unit_price')) || 0,
    is_seasonal: formData.get('is_seasonal') === 'on',
    ingredients: formData.get('ingredients') || '',
    slug: slugInput || buildSlug(name),
    short_description: formData.get('short_description') || '',
    image_url: formData.get('image_url') || '/product/coming-soon.png',
    in_stock: formData.get('in_stock') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    category: formData.get('category') || formData.get('base_type'),
    price_range: formData.get('price_range') || '',
  };

  const [product] = await addProduct(data);
  revalidatePath('/products');
  return { id: product.id };
}

export async function updateProductAction(id, formData) {
  const name = formData.get('name');
  const slugInput = formData.get('slug');
  const data = {
    name,
    base_type: formData.get('base_type'),
    weight_grams: parseInt(formData.get('weight_grams')) || 0,
    unit_price: parseFloat(formData.get('unit_price')) || 0,
    is_seasonal: formData.get('is_seasonal') === 'on',
    ingredients: formData.get('ingredients') || '',
    slug: slugInput || buildSlug(name),
    short_description: formData.get('short_description') || '',
    image_url: formData.get('image_url') || '/product/coming-soon.png',
    in_stock: formData.get('in_stock') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    category: formData.get('category') || formData.get('base_type'),
    price_range: formData.get('price_range') || '',
  };

  await updateProduct(id, data);
  revalidatePath('/products');
}

export async function toggleArchiveAction(id) {
  await toggleArchive(id);
  revalidatePath('/products');
}

export async function deleteProductAction(id) {
  await deleteProduct(id);
  revalidatePath('/products');
}

export async function revalidateProductsAction() {
  const url = process.env.HEALINGSOIL_URL;
  const key = process.env.HEALINGSOIL_API_KEY;
  
  if (!url || !key) {
    console.error('Missing HEALINGSOIL_URL or HEALINGSOIL_API_KEY');
    return { success: false, error: 'Configuration missing' };
  }
  
  try {
    // Note: tag=products is hardcoded as per the requirement
    const response = await fetch(`${url}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'products', secret: key }),
      cache: 'no-store'
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }
  } catch (err) {
    console.error('Revalidation error:', err);
    return { success: false, error: err.message };
  }
}
