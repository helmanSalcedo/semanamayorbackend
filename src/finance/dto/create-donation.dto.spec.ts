import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDonationDto } from './create-donation.dto';

async function errorsFor(extra: Record<string, unknown>) {
  const dto = plainToInstance(CreateDonationDto, {
    amount: 1000,
    allocations: [{ beneficiaryType: 'JUNTA', amount: 1000 }],
    ...extra,
  });
  const errors = await validate(dto);
  return { dto, fields: errors.map((e) => e.property) };
}

describe('CreateDonationDto donor document', () => {
  it('is optional', async () => {
    expect((await errorsFor({})).fields).toEqual([]);
  });

  it('normalizes dots and spaces in the number', async () => {
    const { dto, fields } = await errorsFor({
      donorIdType: 'CC',
      donorIdNumber: '1.234.567 ',
    });
    expect(fields).toEqual([]);
    expect(dto.donorIdNumber).toBe('1234567');
  });

  it('requires the type when the number is sent', async () => {
    expect((await errorsFor({ donorIdNumber: '1234567' })).fields).toContain(
      'donorIdType',
    );
  });

  it('requires the number when the type is sent', async () => {
    expect((await errorsFor({ donorIdType: 'CC' })).fields).toContain(
      'donorIdNumber',
    );
  });
});
