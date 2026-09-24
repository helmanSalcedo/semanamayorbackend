import { DonorIdType } from '@prisma/client';
import {
  formatDonorId,
  isValidDonorId,
  normalizeDonorIdNumber,
} from './donor-id.util';

describe('donor-id.util', () => {
  it('normalizes dots, spaces and case', () => {
    expect(normalizeDonorIdNumber(' 1.234.567 ')).toBe('1234567');
    expect(normalizeDonorIdNumber('ab 12c')).toBe('AB12C');
  });

  it.each([
    [DonorIdType.CC, '1234567', true],
    [DonorIdType.CC, '12AB', false],
    [DonorIdType.NIT, '900123456-7', true],
    [DonorIdType.NIT, '900123456', true],
    [DonorIdType.NIT, '900123456-77', false],
    [DonorIdType.CE, 'E12345', true],
    [DonorIdType.PASSPORT, 'AB123456', true],
    [DonorIdType.PASSPORT, 'AB-1', false],
    [DonorIdType.PPT, '1234567', true],
  ])('%s %s → %s', (type, number, expected) => {
    expect(isValidDonorId(type, number)).toBe(expected);
  });

  it('formats the receipt snapshot', () => {
    expect(formatDonorId(DonorIdType.CC, '1234567')).toBe('CC 1234567');
    expect(formatDonorId(DonorIdType.PASSPORT, 'AB1234')).toBe(
      'Pasaporte AB1234',
    );
    expect(formatDonorId(null, null)).toBeNull();
  });
});
