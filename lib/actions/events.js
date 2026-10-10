'use server';

import { revalidatePath } from 'next/cache';
import {
  createEvent,
  updateEvent,
  updateStallFee,
  deleteEvent,
  getEventRecommendations,
  savePlannedInventory,
  logEventSale,
  undoLastEventSale,
  recordClosingCounts,
  recordCashCounted,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from '@/lib/queries/events';
import { updateSetting } from '@/lib/queries/settings';

// None of these revalidate '/dashboard' directly — the Revenue by Channel
// card reads event_sales live on every dashboard load, same as any other
// KPI, so no cross-feature revalidation wiring is needed here.

export async function createEventAction(data) {
  try {
    const eventId = await createEvent(data);
    revalidatePath('/events');
    return { success: true, eventId };
  } catch (error) {
    console.error('Error in createEventAction:', error);
    return { error: error.message };
  }
}

export async function updateEventAction(id, data) {
  try {
    await updateEvent(id, data);
    revalidatePath('/events');
    revalidatePath(`/events/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error in updateEventAction:', error);
    return { error: error.message };
  }
}

export async function updateStallFeeAction(eventId, fee) {
  try {
    await updateStallFee(eventId, fee);
    revalidatePath(`/events/${eventId}/plan`);
    revalidatePath(`/events/${eventId}/summary`);
    return { success: true };
  } catch (error) {
    console.error('Error in updateStallFeeAction:', error);
    return { error: error.message };
  }
}

export async function deleteEventAction(id) {
  try {
    await deleteEvent(id);
    revalidatePath('/events');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteEventAction:', error);
    return { error: error.message };
  }
}

export async function getEventRecommendationsAction(eventId, targetTotalUnits) {
  try {
    const recommendations = await getEventRecommendations(eventId, targetTotalUnits);
    return { success: true, recommendations };
  } catch (error) {
    console.error('Error in getEventRecommendationsAction:', error);
    return { error: error.message };
  }
}

// The target is persisted as the next event's starting default (settings
// table, same pattern as `monthly_capacity`) — per the owner's "give us
// configuration" preference, this shouldn't be a number buried in code that
// quietly goes stale as event sizes change.
export async function savePlannedInventoryAction(eventId, rows, targetTotalUnits) {
  try {
    await savePlannedInventory(eventId, rows);
    if (targetTotalUnits != null) {
      await updateSetting('event_default_target_units', String(targetTotalUnits));
    }
    revalidatePath(`/events/${eventId}/plan`);
    revalidatePath(`/events/${eventId}/sell`);
    return { success: true };
  } catch (error) {
    console.error('Error in savePlannedInventoryAction:', error);
    return { error: error.message };
  }
}

export async function logEventSaleAction(eventId, productId, quantity, paymentMethod) {
  try {
    const saleId = await logEventSale(eventId, productId, quantity, paymentMethod);
    revalidatePath(`/events/${eventId}/sell`);
    revalidatePath(`/events/${eventId}/summary`);
    return { success: true, saleId };
  } catch (error) {
    console.error('Error in logEventSaleAction:', error);
    return { error: error.message };
  }
}

export async function undoLastEventSaleAction(eventId) {
  try {
    const voidedId = await undoLastEventSale(eventId);
    revalidatePath(`/events/${eventId}/sell`);
    revalidatePath(`/events/${eventId}/summary`);
    return { success: true, voidedId };
  } catch (error) {
    console.error('Error in undoLastEventSaleAction:', error);
    return { error: error.message };
  }
}

export async function recordClosingCountsAction(eventId, rows) {
  try {
    await recordClosingCounts(eventId, rows);
    revalidatePath(`/events/${eventId}/summary`);
    return { success: true };
  } catch (error) {
    console.error('Error in recordClosingCountsAction:', error);
    return { error: error.message };
  }
}

export async function recordCashCountedAction(eventId, cashCounted) {
  try {
    await recordCashCounted(eventId, cashCounted);
    revalidatePath(`/events/${eventId}/summary`);
    return { success: true };
  } catch (error) {
    console.error('Error in recordCashCountedAction:', error);
    return { error: error.message };
  }
}

export async function addChecklistItemAction(eventId, label) {
  try {
    const itemId = await addChecklistItem(eventId, label);
    revalidatePath(`/events/${eventId}/plan`);
    return { success: true, itemId };
  } catch (error) {
    console.error('Error in addChecklistItemAction:', error);
    return { error: error.message };
  }
}

export async function toggleChecklistItemAction(eventId, itemId, isDone) {
  try {
    await toggleChecklistItem(itemId, isDone);
    revalidatePath(`/events/${eventId}/plan`);
    return { success: true };
  } catch (error) {
    console.error('Error in toggleChecklistItemAction:', error);
    return { error: error.message };
  }
}

export async function deleteChecklistItemAction(eventId, itemId) {
  try {
    await deleteChecklistItem(itemId);
    revalidatePath(`/events/${eventId}/plan`);
    return { success: true };
  } catch (error) {
    console.error('Error in deleteChecklistItemAction:', error);
    return { error: error.message };
  }
}
