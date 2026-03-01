'use server';

import { revalidatePath } from 'next/cache';
import { createOrder, updateOrder, deleteOrder, updateOrderStatus } from '@/lib/queries/orders';

export async function createOrderAction(customerData, orderData, items) {
  try {
    const orderId = await createOrder(customerData, orderData, items);
    revalidatePath('/orders');
    revalidatePath('/customers');
    return { success: true, orderId };
  } catch (error) {
    console.error('Error in createOrderAction:', error);
    return { error: error.message };
  }
}

export async function updateOrderAction(id, orderData, items) {
  try {
    await updateOrder(id, orderData, items);
    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error in updateOrderAction:', error);
    return { error: error.message };
  }
}

export async function deleteOrderAction(id) {
  try {
    await deleteOrder(id);
    revalidatePath('/orders');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteOrderAction:', error);
    return { error: error.message };
  }
}

export async function updateOrderStatusAction(id, status) {
  try {
    await updateOrderStatus(id, status);
    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error in updateOrderStatusAction:', error);
    return { error: error.message };
  }
}
