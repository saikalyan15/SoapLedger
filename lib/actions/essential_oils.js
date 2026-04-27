'use server';

import { revalidatePath } from 'next/cache';
import {
  createEssentialOil,
  updateEssentialOil,
  deleteEssentialOil,
  setOilsForProduct,
  setFrequentlyUsed,
} from '../queries/essential_oils';

export async function createEssentialOilAction(formData) {
  const name = formData.get('name')?.toString().trim();
  const notes = formData.get('notes')?.toString().trim() || null;
  const qty = formData.get('quantity_ml')?.toString().trim();
  const quantity_ml = qty ? parseFloat(qty) : null;

  if (!name) return { error: 'Name is required' };

  try {
    await createEssentialOil({ name, notes, quantity_ml });
    revalidatePath('/inventory');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to create essential oil' };
  }
}

export async function updateEssentialOilAction(id, formData) {
  const name = formData.get('name')?.toString().trim();
  const notes = formData.get('notes')?.toString().trim() || null;
  const qty = formData.get('quantity_ml')?.toString().trim();
  const quantity_ml = qty ? parseFloat(qty) : null;

  if (!name) return { error: 'Name is required' };

  try {
    await updateEssentialOil(id, { name, notes, quantity_ml });
    revalidatePath('/inventory');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to update essential oil' };
  }
}

export async function deleteEssentialOilAction(id) {
  try {
    await deleteEssentialOil(id);
    revalidatePath('/inventory');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to delete essential oil' };
  }
}

export async function toggleFrequentlyUsedAction(id, currentValue) {
  try {
    await setFrequentlyUsed(id, !currentValue);
    revalidatePath('/inventory');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to update flag' };
  }
}

export async function saveProductOilsAction(productId, oils) {
  try {
    await setOilsForProduct(productId, oils);
    revalidatePath('/products');
    return { success: true };
  } catch (err) {
    return { error: err.message || 'Failed to save product oils' };
  }
}
