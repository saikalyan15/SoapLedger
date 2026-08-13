'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { createOrder, updateOrder, deleteOrder, updateOrderStatus, updateShipmentStatus, markOrderComplimentary } from '@/lib/queries/orders';

// ... (previous actions)

export async function updateShipmentStatusAction(id, status) {
  try {
    await updateShipmentStatus(id, status);
    revalidatePath('/orders');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error in updateShipmentStatusAction:', error);
    return { error: error.message };
  }
}

export async function createOrderAction(customerData, orderData, items) {
  try {
    const orderId = await createOrder(customerData, orderData, items);
    revalidatePath('/orders');
    revalidatePath('/dashboard');
    return { success: true, orderId };
  } catch (error) {
    console.error('Error in createOrderAction:', error);
    return { error: error.message };
  }
}

export async function updateOrderAction(id, customerData, orderData, items) {
  try {
    await updateOrder(id, customerData, orderData, items);
    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
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
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error in updateOrderStatusAction:', error);
    return { error: error.message };
  }
}

export async function markOrderComplimentaryAction(id) {
  try {
    await markOrderComplimentary(id);
    revalidatePath('/orders');
    revalidatePath(`/orders/${id}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error in markOrderComplimentaryAction:', error);
    return { error: error.message };
  }
}

export async function reconcileRazorpayPaymentAction({ orderId, providerOrderId, paymentId }) {
  const session = await auth();
  if (!session?.user) return { error: 'Sign in again before reconciling a payment.' };

  const normalizedOrderId = String(orderId || '').trim();
  const normalizedProviderOrderId = String(providerOrderId || '').trim();
  const normalizedPaymentId = String(paymentId || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(normalizedOrderId)
    || !/^order_[A-Za-z0-9]+$/.test(normalizedProviderOrderId)
    || !/^pay_[A-Za-z0-9]+$/.test(normalizedPaymentId)) {
    return { error: 'Enter a valid Razorpay payment ID beginning with pay_.' };
  }

  const siteUrl = process.env.HEALINGSOIL_URL?.replace(/\/$/, '');
  const apiKey = process.env.HEALINGSOIL_API_KEY;
  if (!siteUrl || !apiKey) {
    console.error('[Razorpay reconcile] HEALINGSOIL_URL or HEALINGSOIL_API_KEY is missing');
    return { error: 'Payment reconciliation is not configured.' };
  }

  try {
    const response = await fetch(`${siteUrl}/api/razorpay/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        soapledger_order_id: normalizedOrderId,
        provider_order_id: normalizedProviderOrderId,
        provider_payment_id: normalizedPaymentId,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.paid !== true) {
      return { error: data.error || 'Razorpay could not verify this payment.' };
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${normalizedOrderId}`);
    revalidatePath('/dashboard');
    return {
      success: true,
      alreadyConfirmed: data.already_confirmed === true,
      ref: data.ref,
      paymentId: data.payment_id,
    };
  } catch (error) {
    console.error('[Razorpay reconcile] request failed:', error);
    return { error: 'Could not contact the payment verifier. Please try again.' };
  }
}
