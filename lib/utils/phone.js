/**
 * Normalise any phone string to E.164 format ("+CCXXXXXXXXXX").
 * Only adds +91 when we're confident it's an Indian local number.
 */
export function normaliseToE164(raw) {
  const cleaned = String(raw).trim();
  const hasPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\D/g, '');

  if (hasPlus) return '+' + digits;                                     // already E.164

  // 10-digit Indian local (starts 6–9)
  if (digits.length === 10 && /^[6-9]/.test(digits)) return '+91' + digits;

  // 12-digit with Indian country code (91 + 10-digit Indian number)
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits[2])) {
    return '+' + digits;
  }

  // Everything else — prepend + and trust the country code is already present
  // e.g. US "14155551234" → "+14155551234", UK "447911123456" → "+447911123456"
  return '+' + digits;
}

/**
 * Format an E.164 number for human-readable display.
 *   "+919876543210"  →  "+91-9876543210"
 *   "+14155551234"   →  "+1-4155551234"
 *   "+447911123456"  →  "+44-7911123456"
 * Falls back to returning the raw value if format is unrecognised.
 */
export function formatPhoneForDisplay(e164) {
  if (!e164) return '';
  const s = String(e164);
  if (!s.startsWith('+')) return s;

  const digits = s.slice(1); // strip leading +

  // Indian (+91): 2-digit CC + 10-digit number
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91-${digits.slice(2)}`;
  }

  // US/Canada (+1): 1-digit CC + 10-digit number
  if (digits.startsWith('1') && digits.length === 11) {
    return `+1-${digits.slice(1)}`;
  }

  // UK (+44): 2-digit CC
  if (digits.startsWith('44')) {
    return `+44-${digits.slice(2)}`;
  }

  // Generic fallback: split after first 2 digits
  return `+${digits.slice(0, 2)}-${digits.slice(2)}`;
}
