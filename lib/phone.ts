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
  if (!phone) return '';

  // Remove all non-digit characters (spaces, hyphens, brackets, +, etc.)
  let cleaned = phone.replace(/\D/g, '');

  // Handle Pakistani local format (03XXXXXXXXX - 11 digits)
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    cleaned = '92' + cleaned.substring(1);
  }
  // Handle any local format starting with 0 and having 11 digits
  else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '92' + cleaned.substring(1);
  }
  // Handle international format starting with 0092
  else if (cleaned.startsWith('0092')) {
    cleaned = cleaned.substring(2);
  }
  // Handle edge case where number starts with 9203 (13 digits: +92 0300 1234567)
  else if (cleaned.startsWith('9203') && cleaned.length === 13) {
    cleaned = '92' + cleaned.substring(3);
  }
  // Handle 10 digit number starting with 3 (e.g. 3001234567)
  else if (cleaned.startsWith('3') && cleaned.length === 10) {
    cleaned = '92' + cleaned;
  }

  return cleaned;
}

/**
 * Validate Pakistani mobile number
 * Accepts valid Pakistani mobile numbers in normalized format (923XXXXXXXXX - 12 digits total)
 * Supports all standard and newer mobile prefixes (0300-0399)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  
  // Valid normalized Pakistani mobile number starts with 923 and is exactly 12 digits total
  return /^923[0-9]{9}$/.test(normalized);
}