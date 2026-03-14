'use server';

import { revalidatePath } from 'next/cache';
import { addProduct, updateProduct, toggleArchive } from '../queries/products';

export async function createProductAction(formData) {
  const data = {
    name: formData.get('name'),
    base_type: formData.get('base_type'),
    weight_grams: parseInt(formData.get('weight_grams')) || 0,
    unit_price: parseFloat(formData.get('unit_price')) || 0,
    is_seasonal: formData.get('is_seasonal') === 'on',
    ingredients: formData.get('ingredients') || '',
    slug: formData.get('slug') || formData.get('name').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    short_description: formData.get('short_description') || '',
    image_url: formData.get('image_url') || '',
    in_stock: formData.get('in_stock') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    category: formData.get('category') || formData.get('base_type'),
    price_range: formData.get('price_range') || '',
  };

  await addProduct(data);
  revalidatePath('/', 'layout');
}

export async function updateProductAction(id, formData) {
  const data = {
    name: formData.get('name'),
    base_type: formData.get('base_type'),
    weight_grams: parseInt(formData.get('weight_grams')) || 0,
    unit_price: parseFloat(formData.get('unit_price')) || 0,
    is_seasonal: formData.get('is_seasonal') === 'on',
    ingredients: formData.get('ingredients') || '',
    slug: formData.get('slug') || formData.get('name').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    short_description: formData.get('short_description') || '',
    image_url: formData.get('image_url') || '',
    in_stock: formData.get('in_stock') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    category: formData.get('category') || formData.get('base_type'),
    price_range: formData.get('price_range') || '',
  };

  await updateProduct(id, data);
  revalidatePath('/', 'layout');
}

export async function toggleArchiveAction(id) {
  await toggleArchive(id);
  revalidatePath('/', 'layout');
}
