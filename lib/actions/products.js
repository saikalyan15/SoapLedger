'use server';

import { revalidatePath } from 'next/cache';
import { addProduct, updateProduct, toggleArchive, deleteProduct, updateProductSequence, updateFeaturedProducts } from '../queries/products';

const VALID_TEXTURES = ['smooth', 'mildly-textured', 'textured', 'loofah'];

/**
 * Push a cache purge to the healingsoil.in storefront.
 *
 * The storefront caches this product list for 6 hours (see
 * healing-soil/src/lib/products.ts). That long TTL exists because every cache
 * miss wakes our Neon compute for a full 5 billed minutes. On-demand purging is
 * therefore the primary way the storefront stays fresh — not the TTL.
 *
 * Never throws: a storefront that is briefly stale is far better than a product
 * edit that appears to fail. Failures are logged and returned for the caller to
 * surface if it wants to.
 */
async function pushProductsRevalidation() {
  const url = process.env.HEALINGSOIL_URL;
  const key = process.env.HEALINGSOIL_API_KEY;

  if (!url || !key) {
    console.error(
      '[revalidate] Missing HEALINGSOIL_URL or HEALINGSOIL_API_KEY — storefront not purged'
    );
    return { success: false, error: 'Configuration missing' };
  }

  try {
    const response = await fetch(`${url}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'products', secret: key }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[revalidate] Storefront purge failed: ${errorText}`);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (err) {
    console.error('[revalidate] Storefront purge error:', err);
    return { success: false, error: err.message };
  }
}

function parseTexture(formData) {
  const raw = formData.get('texture') || null;
  if (raw && !VALID_TEXTURES.includes(raw)) {
    throw new Error(`Invalid texture value: "${raw}". Must be one of: ${VALID_TEXTURES.join(', ')}`);
  }
  return raw || null;
}

export async function updateProductSequenceAction(updates) {
  await updateProductSequence(updates);
  revalidatePath('/products');
  await pushProductsRevalidation();
}

export async function updateFeaturedProductsAction(updates) {
  await updateFeaturedProducts(updates);
  revalidatePath('/products');
  await pushProductsRevalidation();
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
    is_wholesale_eligible: formData.get('is_wholesale_eligible') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    is_gift: formData.get('is_gift') === 'on',
    category: formData.get('category') || formData.get('base_type'),
    price_range: formData.get('price_range') || '',
    notes: formData.get('notes') || '',
    texture: parseTexture(formData),
  };

  const [product] = await addProduct(data);
  revalidatePath('/products');
  await pushProductsRevalidation();
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
    is_wholesale_eligible: formData.get('is_wholesale_eligible') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    is_gift: formData.get('is_gift') === 'on',
    category: formData.get('category') || formData.get('base_type'),
    price_range: formData.get('price_range') || '',
    notes: formData.get('notes') || '',
    texture: parseTexture(formData),
  };

  await updateProduct(id, data);
  revalidatePath('/products');
  await pushProductsRevalidation();
}

export async function toggleArchiveAction(id) {
  await toggleArchive(id);
  revalidatePath('/products');
  await pushProductsRevalidation();
}

export async function deleteProductAction(id) {
  await deleteProduct(id);
  revalidatePath('/products');
  await pushProductsRevalidation();
}

/**
 * Manual "refresh storefront" button in the Products view.
 * All product mutations now purge automatically, so this is only a fallback for
 * when an automatic purge failed (e.g. the storefront was briefly down).
 */
export async function revalidateProductsAction() {
  return pushProductsRevalidation();
}
