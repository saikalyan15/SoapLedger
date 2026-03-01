'use server';

import { createOrder, deleteOrder } from '../queries/orders';
import { revalidatePath } from 'next/cache';

export async function submitOrderAction(data) {
  try {
    const orderId = await createOrder(
      { name: data.customerName, phone: data.phone, address: data.address },
      { 
        order_date: data.orderDate, 
        order_value: data.orderValue, 
        shipping_charge: data.shippingCharge,
        packaging_cost: data.packagingCost,
        material_cost: data.materialCost,
        status: data.status,
        notes: data.notes
      },
      data.items
    );
    
    revalidatePath('/orders');
    return { success: true, orderId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteOrderAction(id) {
  await deleteOrder(id);
  revalidatePath('/orders');
}
