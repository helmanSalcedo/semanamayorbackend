import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateDonorDocumentDto } from './update-donor-document.dto';

async function check(body: Record<string, unknown>) {
  const dto = plainToInstance(UpdateDonorDocumentDto, body);
  const errors = await validate(dto);
  return { dto, fields: errors.map((e) => e.property) };
}

describe('UpdateDonorDocumentDto', () => {
  it('normalizes the number', async () => {
    const { dto, fields } = await check({
      donorIdType: 'CC',
      donorIdNumber: '1.234.567',
    });
    expect(fields).toEqual([]);
    expect(dto.donorIdNumber).toBe('1234567');
  });

  it('requires both fields', async () => {
    expect((await check({})).fields).toEqual(
      expect.arrayContaining(['donorIdType', 'donorIdNumber']),
    );
  });

  it('rejects an unknown document type', async () => {
    expect(
      (await check({ donorIdType: 'DNI', donorIdNumber: '123' })).fields,
    ).toContain('donorIdType');
  });
});
