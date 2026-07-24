// India state list — must match the `st_nm` property values in
// public/data/india-states.geojson exactly, since the dashboard map
// looks up order counts by this name.
export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

// PIN code first-3-digit ranges → state. Best-effort only (a handful of
// prefixes are genuinely shared/ambiguous at the border) — always a
// suggestion the order form lets the user override, never authoritative.
const PIN_RANGES = [
  [180, 194, 'Jammu and Kashmir'],
  [171, 177, 'Himachal Pradesh'],
  [140, 160, 'Punjab'],
  [160, 160, 'Chandigarh'],
  [244, 263, 'Uttarakhand'],
  [121, 136, 'Haryana'],
  [110, 110, 'Delhi'],
  [301, 345, 'Rajasthan'],
  [201, 285, 'Uttar Pradesh'],
  [800, 855, 'Bihar'],
  [737, 737, 'Sikkim'],
  [790, 792, 'Arunachal Pradesh'],
  [797, 798, 'Nagaland'],
  [795, 795, 'Manipur'],
  [796, 796, 'Mizoram'],
  [799, 799, 'Tripura'],
  [793, 794, 'Meghalaya'],
  [781, 788, 'Assam'],
  [700, 743, 'West Bengal'],
  [813, 835, 'Jharkhand'],
  [751, 770, 'Odisha'],
  [490, 497, 'Chhattisgarh'],
  [450, 488, 'Madhya Pradesh'],
  [360, 396, 'Gujarat'],
  [400, 445, 'Maharashtra'],
  [560, 591, 'Karnataka'],
  [403, 403, 'Goa'],
  [682, 682, 'Lakshadweep'],
  [670, 695, 'Kerala'],
  [600, 643, 'Tamil Nadu'],
  [605, 605, 'Puducherry'],
  [607, 607, 'Puducherry'],
  [609, 609, 'Puducherry'],
  [744, 744, 'Andaman and Nicobar Islands'],
  [500, 509, 'Telangana'],
  [510, 535, 'Andhra Pradesh'],
];

export function stateFromPincode(pincode) {
  const prefix = parseInt(String(pincode).slice(0, 3), 10);
  if (!Number.isFinite(prefix)) return null;
  const match = PIN_RANGES.find(([min, max]) => prefix >= min && prefix <= max);
  return match ? match[2] : null;
}

// Known city keywords → {city, state}. Matched case-insensitively against
// free-text addresses. Extend this list as new cities show up in orders —
// it only needs to cover places this business actually ships to.
const KNOWN_CITIES = [
  [/bangalore|bengaluru|\bblr\b|sarjapur|sadanandnagar/i, 'Bengaluru', 'Karnataka'],
  [/hassan/i, 'Hassan', 'Karnataka'],
  [/hubli|dharwa?d/i, 'Hubli', 'Karnataka'],
  [/madurai/i, 'Madurai', 'Tamil Nadu'],
  [/coimbatore/i, 'Coimbatore', 'Tamil Nadu'],
  [/chennai/i, 'Chennai', 'Tamil Nadu'],
  [/dehradun/i, 'Dehradun', 'Uttarakhand'],
  [/margao/i, 'Margao', 'Goa'],
  [/mapusa/i, 'Mapusa', 'Goa'],
  [/benaulim/i, 'Benaulim', 'Goa'],
  [/zuarinagar|sancoale/i, 'Sancoale', 'Goa'],
  [/porvorim|alto-betim/i, 'Porvorim', 'Goa'],
  [/panaji|panjim/i, 'Panaji', 'Goa'],
  [/\bpune\b|hinjewadi|nigdi/i, 'Pune', 'Maharashtra'],
  [/mumbai|andheri/i, 'Mumbai', 'Maharashtra'],
  [/valanchery/i, 'Valanchery', 'Kerala'],
  [/kochi|cochin/i, 'Kochi', 'Kerala'],
  [/bhopal|sehore/i, 'Bhopal', 'Madhya Pradesh'],
  [/indore/i, 'Indore', 'Madhya Pradesh'],
  [/jaipur/i, 'Jaipur', 'Rajasthan'],
  [/hyderabad/i, 'Hyderabad', 'Telangana'],
  [/delhi|new delhi/i, 'Delhi', 'Delhi'],
  [/gurgaon|gurugram/i, 'Gurugram', 'Haryana'],
  [/noida/i, 'Noida', 'Uttar Pradesh'],
  [/kolkata|calcutta/i, 'Kolkata', 'West Bengal'],
  [/ahmedabad/i, 'Ahmedabad', 'Gujarat'],
];

// Best-effort location guess from a free-text address (as pasted from
// WhatsApp/website order forms). Always a suggestion — the caller should
// let the user review/edit city and state, never trust this blindly.
export function suggestLocationFromAddress(addressText) {
  if (!addressText || /^hand delivered/i.test(addressText.trim())) {
    return { city: '', state: '' };
  }

  let city = '';
  let state = '';

  for (const [re, matchedCity, matchedState] of KNOWN_CITIES) {
    if (re.test(addressText)) {
      city = matchedCity;
      state = matchedState;
      break;
    }
  }

  if (!state) {
    const pinMatch = addressText.match(/\b(\d{6})\b/);
    if (pinMatch) {
      state = stateFromPincode(pinMatch[1]) || '';
    }
  }

  return { city, state };
}
