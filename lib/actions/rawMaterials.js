'use server';

import { revalidatePath } from 'next/cache';
import { addRawMaterial, deleteRawMaterial } from '../queries/rawMaterials';

export async function createRawMaterialAction(formData) {
  const data = {
    name: formData.get('name'),
    category: formData.get('category'),
    quantity: parseFloat(formData.get('quantity')) || 0,
    unit: formData.get('unit'),
    unit_cost: parseFloat(formData.get('unit_cost')) || 0,
    procured_on: formData.get('procured_on'),
    notes: formData.get('notes'),
  };

  await addRawMaterial(data);
  revalidatePath('/raw-materials');
}

export async function deleteRawMaterialAction(id) {
  await deleteRawMaterial(id);
  revalidatePath('/raw-materials');
}
