// Indian Mobile Phone Normalization & Validation Utility

/**
 * Normalizes an Indian mobile phone number to a standard 10-digit format.
 * Handles:
 *  - "+91 98765 43210" -> "9876543210"
 *  - "+91-98765-43210" -> "9876543210"
 *  - "09876543210" -> "9876543210"
 *  - "919876543210" -> "9876543210"
 *  - " 9876543210 " -> "9876543210"
 */
export function normalizeIndianPhone(input: string): string {
  if (!input) return '';

  // Remove all non-numeric characters except +
  let cleaned = input.replace(/[^\d+]/g, '');

  // Strip leading +91 or 91 if it results in a 10-digit number
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Final scrub to only keep digits
  return cleaned.replace(/\D/g, '');
}

/**
 * Validates if a normalized phone number is a valid 10-digit Indian mobile number
 * (Starts with 6, 7, 8, or 9 and has exactly 10 digits).
 */
export function isValidIndianPhone(phone: string): boolean {
  const normalized = normalizeIndianPhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
}

/**
 * Formats a 10-digit Indian phone number for friendly UI display
 * e.g. "9876543210" -> "+91 98765 43210"
 */
export function formatPhoneDisplay(phone: string): string {
  const norm = normalizeIndianPhone(phone);
  if (norm.length === 10) {
    return `+91 ${norm.slice(0, 5)} ${norm.slice(5)}`;
  }
  return phone;
}
