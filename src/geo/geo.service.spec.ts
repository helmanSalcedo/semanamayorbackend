import { GeoService } from './geo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GeoService', () => {
  let prisma: {
    country: { findMany: jest.Mock };
    department: { findMany: jest.Mock };
    municipality: { findMany: jest.Mock };
    locality: { findMany: jest.Mock };
  };
  let service: GeoService;

  beforeEach(() => {
    prisma = {
      country: { findMany: jest.fn().mockResolvedValue([]) },
      department: { findMany: jest.fn().mockResolvedValue([]) },
      municipality: { findMany: jest.fn().mockResolvedValue([]) },
      locality: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new GeoService(prisma as unknown as PrismaService);
  });

  it('filters departments by countryId', async () => {
    await service.findAllDepartments('country-1');
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { countryId: 'country-1' } }),
    );
  });

  it('lists all departments when no countryId is given', async () => {
    await service.findAllDepartments();
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { countryId: undefined } }),
    );
  });

  it('filters municipalities by departmentId', async () => {
    await service.findAllMunicipalities('dept-1');
    expect(prisma.municipality.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { departmentId: 'dept-1' } }),
    );
  });

  it('filters localities by municipalityId', async () => {
    await service.findAllLocalities('mun-1');
    expect(prisma.locality.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { municipalityId: 'mun-1' } }),
    );
  });
});
