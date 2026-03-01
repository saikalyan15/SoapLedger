'use server';

import { revalidatePath } from 'next/cache';
import { createCustomer, updateCustomer, deleteCustomer } from '@/lib/queries/customers';

export async function addCustomerAction(formData) {
  const name = formData.get('name');
  const phone = formData.get('phone');
  const address = formData.get('address');
  const notes = formData.get('notes');

  try {
    await createCustomer(name, phone, address, notes);
    revalidatePath('/customers');
    return { success: true };
  } catch (error) {
    console.error('Error adding customer:', error);
    return { error: error.message };
  }
}

export async function editCustomerAction(id, formData) {
  const name = formData.get('name');
  const phone = formData.get('phone');
  const address = formData.get('address');
  const notes = formData.get('notes');

  try {
    await updateCustomer(id, name, phone, address, notes);
    revalidatePath('/customers');
    return { success: true };
  } catch (error) {
    console.error('Error editing customer:', error);
    return { error: error.message };
  }
}

export async function deleteCustomerAction(id) {
  try {
    await deleteCustomer(id);
    revalidatePath('/customers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { error: error.message };
  }
}
