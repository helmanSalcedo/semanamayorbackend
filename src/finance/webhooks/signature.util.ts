import { createHash, timingSafeEqual } from 'crypto';

/**
 * Constant-time hex-digest comparison — a plain `===` on the hex strings
 * leaks timing information proportional to how many leading characters
 * match, which is exactly the kind of side channel signature checks exist
 * to close.
 */
function hexEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a.toLowerCase(), 'hex');
  const bufB = Buffer.from(b.toLowerCase(), 'hex');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Wompi "Eventos" webhook signature (their public docs, "Cómo verificar el
 * origen de un evento"): checksum = SHA256(concat(values of the properties
 * listed in signature.properties, read from `data` by dot-path) + timestamp
 * + EVENTS_SECRET).
 */
export interface WompiEventPayload {
  data: Record<string, unknown>;
  signature: { properties: string[]; checksum: string };
  timestamp: number;
}

function getByPathAsString(obj: unknown, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as never)[key] : undefined,
      obj,
    );
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  // Wompi's signed properties are always scalar (id/status/amount); an
  // object/array here means the payload doesn't match what we expect.
  return '';
}

export function verifyWompiSignature(
  payload: WompiEventPayload,
  eventsSecret: string,
): boolean {
  const concatenated = payload.signature.properties
    .map((prop) => getByPathAsString(payload.data, prop))
    .join('');
  const expected = sha256Hex(
    concatenated + String(payload.timestamp) + eventsSecret,
  );
  return hexEquals(expected, payload.signature.checksum);
}

/**
 * PayU Latam confirmation-webhook signature (their public docs, "Firma de
 * confirmación"): MD5(ApiKey~merchantId~referenceCode~value~currency~statePol).
 * `value` must be formatted with exactly one decimal place trimmed to the
 * shortest form PayU expects (e.g. "20000.0", not "20000.00" or "20000") —
 * this is the single most common source of signature mismatches in real
 * integrations and MUST be re-verified against PayU's actual sandbox before
 * relying on it in production.
 */
export interface PayuConfirmationPayload {
  merchantId: string;
  referenceCode: string;
  value: string;
  currency: string;
  statePol: string;
  sign: string;
}

function md5Hex(input: string): string {
  return createHash('md5').update(input, 'utf8').digest('hex');
}

export function verifyPayuSignature(
  payload: PayuConfirmationPayload,
  apiKey: string,
): boolean {
  const raw = [
    apiKey,
    payload.merchantId,
    payload.referenceCode,
    payload.value,
    payload.currency,
    payload.statePol,
  ].join('~');
  return hexEquals(md5Hex(raw), payload.sign);
}

/**
 * ePayco confirmation-webhook signature (their public docs, "Firma de
 * seguridad"): SHA256(p_cust_id_cliente^p_key^x_ref_payco^x_transaction_id^
 * x_amount^x_currency_code).
 */
export interface EpaycoConfirmationPayload {
  xRefPayco: string;
  xTransactionId: string;
  xAmount: string;
  xCurrencyCode: string;
  xSignature: string;
}

export function verifyEpaycoSignature(
  payload: EpaycoConfirmationPayload,
  custIdCliente: string,
  pKey: string,
): boolean {
  const raw = [
    custIdCliente,
    pKey,
    payload.xRefPayco,
    payload.xTransactionId,
    payload.xAmount,
    payload.xCurrencyCode,
  ].join('^');
  return hexEquals(sha256Hex(raw), payload.xSignature);
}
