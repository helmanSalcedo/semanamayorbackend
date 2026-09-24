import { DonorIdType } from '@prisma/client';

/**
 * Per-type shape of Colombian identity documents, checked after
 * normalization (dots/spaces removed, uppercased). NIT may carry its
 * verification digit as "900123456-7".
 */
const DONOR_ID_PATTERNS: Record<DonorIdType, RegExp> = {
  CC: /^\d{3,10}$/,
  CE: /^[A-Z0-9]{3,15}$/,
  NIT: /^\d{6,10}(-\d)?$/,
  PASSPORT: /^[A-Z0-9]{5,20}$/,
  PPT: /^\d{5,15}$/,
};

/** "1.234.567" → "1234567", " ab 12 " → "AB12". */
export function normalizeDonorIdNumber(value: string): string {
  return value.replace(/[.\s]/g, '').toUpperCase();
}

export function isValidDonorId(type: DonorIdType, number: string): boolean {
  return DONOR_ID_PATTERNS[type].test(number);
}

/** Printable form stored in donation_receipt.tax_id_snapshot. */
export function formatDonorId(
  type: DonorIdType | null,
  number: string | null,
): string | null {
  if (!type || !number) {
    return null;
  }
  return `${type === DonorIdType.PASSPORT ? 'Pasaporte' : type} ${number}`;
}
