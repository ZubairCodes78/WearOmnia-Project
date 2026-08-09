/**
 * Pakistani Phone Number Utility
 * Centralized phone normalization and validation for WearOMNIA
 */

/**
 * Normalize Pakistani phone number to international format (92XXXXXXXXX)
 * Handles various input formats:
 * - 03001234567 -> 923001234567
 * - +923001234567 -> 923001234567
 * - 923001234567 -> 923001234567
 * - 0300 1234567 -> 923001234567
 * - 0300-1234567 -> 923001234567
 * - +92 300 1234567 -> 923001234567
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters (spaces, hyphens, brackets, etc.)
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Pakistani local format (03XXXXXXXXX)
  if (cleaned.startsWith('03')) {
    cleaned = '92' + cleaned.substring(1);
  }
  
  // Handle format with leading 0 but not 03
  else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '92' + cleaned.substring(1);
  }
  
  // Handle +92 prefix
  else if (cleaned.startsWith('92') && cleaned.length === 12) {
    // Already in correct format
    cleaned = cleaned;
  }
  
  // Handle case where number starts with 920 (edge case)
  else if (cleaned.startsWith('920')) {
    cleaned = '92' + cleaned.substring(3);
  }
  
  return cleaned;
}

/**
 * Validate Pakistani mobile number
 * Accepts valid Pakistani mobile prefixes (03XX-09XX)
 * After normalization, should be 12 digits starting with 92
 */
export function validatePhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  
  // Check if normalized number is 12 digits and starts with 92
  if (!/^92[0-9]{9}$/.test(normalized)) {
    return false;
  }
  
  // Check for valid Pakistani mobile prefixes (after removing 92)
  // Valid Pakistani mobile prefixes are 03XX-09XX
  const mobilePrefix = normalized.substring(2, 5);
  
  // Check if it's a valid Pakistani mobile prefix (0XX, where XX is 00-99)
  // This includes all standard Pakistani mobile operators
  return /^0[0-9]{2}$/.test(mobilePrefix);
}