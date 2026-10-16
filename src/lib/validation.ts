/**
 * Validation helpers for Indian 10-digit mobile numbers and emails.
 */

export interface ValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Validates and normalizes 10-digit Indian mobile numbers.
 * Accepts:
 * - 10 digits starting with 6-9: e.g. 9876543210
 * - Leading zero: 09876543210
 * - Country code: +919876543210
 * - Formatted: 98765 43210, 98765-43210
 *
 * Normalizes valid numbers to E.164 standard: +91XXXXXXXXXX
 */
export function validateMobileNumber(raw: string): ValidationResult {
  if (!raw || !raw.trim()) {
    return {
      isValid: false,
      normalized: "",
      error: "Mobile number is required.",
    };
  }

  // Remove spaces, hyphens, and formatting characters
  const cleaned = raw.trim().replace(/[\s\-()]/g, "");

  // Check if international other than +91
  if (cleaned.startsWith("+") && !cleaned.startsWith("+91")) {
    if (/^\+[1-9]\d{8,14}$/.test(cleaned)) {
      return { isValid: true, normalized: cleaned };
    }
    return {
      isValid: false,
      normalized: "",
      error: "Please enter a valid international phone number with country code.",
    };
  }

  // Extract core digits
  let digits = cleaned;
  if (digits.startsWith("+91")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Validate exactly 10 digits starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(digits)) {
    return {
      isValid: true,
      normalized: `+91${digits}`,
    };
  }

  if (!/^\d+$/.test(digits)) {
    return {
      isValid: false,
      normalized: "",
      error: "Mobile number can only contain numeric digits.",
    };
  }

  if (digits.length < 10) {
    return {
      isValid: false,
      normalized: "",
      error: `Mobile number must be 10 digits (currently ${digits.length} digits).`,
    };
  }

  if (digits.length > 10) {
    return {
      isValid: false,
      normalized: "",
      error: `Mobile number cannot exceed 10 digits (currently ${digits.length} digits).`,
    };
  }

  if (!/^[6-9]/.test(digits)) {
    return {
      isValid: false,
      normalized: "",
      error: "Valid Indian mobile numbers must start with 6, 7, 8, or 9.",
    };
  }

  return {
    isValid: false,
    normalized: "",
    error: "Please enter a valid 10-digit mobile number.",
  };
}

/**
 * Validates email format if provided. (Empty is allowed since email is optional)
 */
export function validateEmail(raw?: string | null): { isValid: boolean; normalized?: string; error?: string } {
  if (!raw || !raw.trim()) {
    return { isValid: true, normalized: undefined };
  }

  const trimmed = raw.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Please enter a valid email address (e.g. name@example.com).",
    };
  }

  return { isValid: true, normalized: trimmed };
}

/**
 * Validates and formats 12-digit Indian Aadhaar number.
 */
export function validateAadharNumber(raw?: string | null): { isValid: boolean; normalized?: string; formatted?: string; error?: string } {
  if (!raw || !raw.trim()) {
    return { isValid: true, normalized: undefined };
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 12) {
    return {
      isValid: false,
      error: `Aadhaar number must be exactly 12 digits (currently ${digits.length} digits).`,
    };
  }

  if (digits.startsWith("0") || digits.startsWith("1")) {
    return {
      isValid: false,
      error: "Aadhaar number cannot start with 0 or 1.",
    };
  }

  const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
  return { isValid: true, normalized: digits, formatted };
}
