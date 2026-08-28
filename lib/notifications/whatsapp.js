function refFor(id) {
  return `HS-${String(id).slice(0, 8).toUpperCase()}`;
}

async function sendWhatsAppTemplate(templateName, parameters) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const founderPhone = process.env.WHATSAPP_FOUNDER_PHONE;

  if (!token || !phoneNumberId || !founderPhone) {
    const error = 'WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_FOUNDER_PHONE is missing';
    console.error(`[WhatsApp notify] ${error}`);
    return { success: false, error };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: founderPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: parameters.map((text) => ({ type: 'text', text })),
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[WhatsApp notify] Meta API error:', response.status, body);
      return { success: false, error: `Meta API error ${response.status}` };
    }
    return { success: true };
  } catch (error) {
    console.error('[WhatsApp notify] request failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOrderWhatsAppAlert({ orderId, customerName, orderValue, itemCount, source }) {
  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE_NAME || 'new_order_alert';
  const ref = refFor(orderId);
  const amount = `Rs ${Number(orderValue || 0).toFixed(2)}`;
  const items = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  return sendWhatsAppTemplate(templateName, [ref, customerName || 'Unknown', amount, items, source || 'Manual']);
}

export async function sendOrderStatusWhatsAppAlert({ orderId, customerName, status }) {
  const templateName = process.env.WHATSAPP_STATUS_TEMPLATE_NAME || 'order_status_update';
  const ref = refFor(orderId);
  return sendWhatsAppTemplate(templateName, [ref, customerName || 'Unknown', status]);
}
