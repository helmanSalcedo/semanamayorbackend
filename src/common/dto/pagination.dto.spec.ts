import { PaginationDto, paginate } from './pagination.dto';

describe('PaginationDto', () => {
  it('computes skip from page/limit', () => {
    const dto = new PaginationDto();
    dto.page = 3;
    dto.limit = 10;
    expect(dto.skip).toBe(20);
  });

  it('defaults to page 1, limit 20', () => {
    const dto = new PaginationDto();
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.skip).toBe(0);
  });
});

describe('paginate', () => {
  it('builds the meta block from total and page size', () => {
    const dto = new PaginationDto();
    dto.page = 2;
    dto.limit = 10;

    const result = paginate(['a', 'b'], 25, dto);

    expect(result).toEqual({
      data: ['a', 'b'],
      meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
  });

  it('never reports fewer than 1 total page, even with zero results', () => {
    const dto = new PaginationDto();
    const result = paginate([], 0, dto);
    expect(result.meta.totalPages).toBe(1);
  });
});
